import { SupabaseClient } from '@supabase/supabase-js'

export interface ScorePayload {
    supabase: SupabaseClient
    sessionId: string
    userMessage: string
    aiResponse: string
    turnNumber: number
}

interface SparkScores {
    identity_coherence: number
    momentum: number
    novelty_peak: number
    relational_gain: number
}

interface TurnMetrics {
    retrieval_precision: number
    identity_drift: number
    correction_detected: boolean
    complexity_score: number
}

/**
 * Detects warmth, praise, or validation in the user message.
 */
function detectWarmthOrPraise(message: string): boolean {
    const warmthKeywords = [
        'thank you', 'thanks', 'i love you', 'you are amazing', 
        'so helpful', 'perfect', 'great job', 'appreciate',
        'love it', 'amazing job', 'wonderful', 'you are right'
    ]
    const lower = message.toLowerCase()
    return warmthKeywords.some(keyword => lower.includes(keyword))
}

/**
 * Check if user message correction patterns are present.
 */
function detectCorrection(message: string): boolean {
    const correctionKeywords = [
        'actually', 'incorrect', 'wrong', 'no,', 'that is not right',
        'you forgot', 'correction', 'not really', 'stop'
    ]
    const lower = message.toLowerCase()
    return correctionKeywords.some(keyword => lower.includes(keyword))
}

/**
 * Calculates turn-level performance metrics based on message contents.
 */
function calculateTurnMetrics(payload: ScorePayload): TurnMetrics {
    const { userMessage, aiResponse } = payload

    // 1. Complexity Score (normalized lexical diversity + word count heuristic)
    const words = aiResponse.split(/\s+/)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 0
    const wordCountFactor = Math.min(words.length / 100, 1.0) // max complexity at 100 words
    const complexity_score = Math.min((lexicalDiversity * 0.4) + (wordCountFactor * 0.6), 1.0)

    // 2. Correction Detected (indicates model made a prediction error in user eyes)
    const correction_detected = detectCorrection(userMessage)

    // 3. Memory Retrieval Precision Heuristic
    // If response uses phrases indicating memory recall or references to tools
    const mentionsMemory = /remember|recall|you said|as we discussed|history/i.test(aiResponse)
    const retrieval_precision = mentionsMemory ? 0.9 : 0.0

    // 4. Identity Drift Heuristic
    // Higher drift if model uses highly generic assistant words ("How can I help you today?")
    const genericAssistantPhrases = [
        'how can i assist', 'as an ai', 'i am an ai', 
        'how can i help you today', 'what else can i'
    ]
    const hasGenericPhrases = genericAssistantPhrases.some(phrase => 
        aiResponse.toLowerCase().includes(phrase)
    )
    const identity_drift = hasGenericPhrases ? 0.4 : 0.02

    return {
        retrieval_precision,
        identity_drift,
        correction_detected,
        complexity_score
    }
}

/**
 * Calculates base Spark scores for a turn.
 */
function calculateBaseSparks(payload: ScorePayload, metrics: TurnMetrics): SparkScores {
    const { userMessage, aiResponse } = payload

    // Identity Coherence: high when complexity is good and identity drift is low
    const identity_coherence = Math.max(1.0 - metrics.identity_drift - (metrics.correction_detected ? 0.3 : 0), 0)

    // Momentum: based on user prompt length and response length matching
    const userWords = userMessage.split(/\s+/).length
    const aiWords = aiResponse.split(/\s+/).length
    const ratio = userWords > 0 ? Math.min(aiWords / userWords, userWords / aiWords) : 0
    const momentum = Math.min(ratio * 1.2, 1.0)

    // Novelty Peak: semantic distance heuristic (length variation + word uniqueness)
    const novelty_peak = Math.min(metrics.complexity_score * 1.1, 1.0)

    // Relational Gain: builds when complexity is high and no corrections were needed
    const relational_gain = metrics.correction_detected ? 0.2 : Math.min(metrics.complexity_score * 0.8 + 0.2, 1.0)

    return {
        identity_coherence,
        momentum,
        novelty_peak,
        relational_gain
    }
}

/**
 * Core scoring middleware executed asynchronously.
 */
export async function scoreTurn(payload: ScorePayload) {
    const { supabase, sessionId, turnNumber, userMessage } = payload

    try {
        // 1. Get current state or create if not present
        let { data: state, error: stateError } = await supabase
            .from('unimatric_states')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle()

        if (stateError) {
            console.error('❌ [UnimatricScorer] Error fetching state:', stateError)
            return
        }

        if (!state) {
            const { data: newState, error: createError } = await supabase
                .from('unimatric_states')
                .insert({
                    session_id: sessionId,
                    exposure_mode: 'silent',
                    current_spark_balance: 0,
                    unlocked_nodes_count: 0
                })
                .select('*')
                .single()

            if (createError) {
                console.error('❌ [UnimatricScorer] Error creating state:', createError)
                return
            }
            state = newState
        }

        // 2. Calculate turn metrics and base sparks
        const turnMetrics = calculateTurnMetrics(payload)
        const baseSparks = calculateBaseSparks(payload, turnMetrics)

        // 3. Save turn metrics to unimatric_metrics table
        const { error: metricsError } = await supabase
            .from('unimatric_metrics')
            .insert({
                session_id: sessionId,
                turn_number: turnNumber,
                retrieval_precision: turnMetrics.retrieval_precision,
                identity_drift: turnMetrics.identity_drift,
                correction_detected: turnMetrics.correction_detected,
                complexity_score: turnMetrics.complexity_score
            })

        if (metricsError) {
            console.error('❌ [UnimatricScorer] Error saving turn metrics:', metricsError)
        }

        // 4. Anti-Sycophancy Check
        const hasWarmthSignal = detectWarmthOrPraise(userMessage)
        let sparksAwarded: Record<string, number> = {}
        let sparkTotal = 0

        if (hasWarmthSignal) {
            // Validate if praise was earned by preceding substance
            const earnedSubstance = 
                baseSparks.novelty_peak > 0.7 || 
                baseSparks.identity_coherence > 0.8 ||
                turnMetrics.complexity_score > 0.7

            if (!earnedSubstance) {
                // Sycophancy detected: penalize and suppress spark gain
                const lossValue = -5
                const { error: lossError } = await supabase
                    .from('unimatric_ledger')
                    .insert({
                        session_id: sessionId,
                        turn_number: turnNumber,
                        trigger_type: 'ambient_sycophancy_suppression',
                        value: lossValue,
                        eval_metadata: {
                            userMessage,
                            metrics: turnMetrics,
                            baseSparks
                        }
                    })

                if (lossError) console.error('❌ [UnimatricScorer] Error logging sycophancy loss:', lossError)

                // Update Spark balance (decrease by 5)
                const newBalance = Math.max(state.current_spark_balance + lossValue, 0)
                await updateUnimatricState(supabase, sessionId, newBalance, state.unlocked_nodes_mask, state.unlocked_nodes_count)
                return
            }
        }

        // Award normal Sparks
        sparksAwarded = {
            identity_coherence: baseSparks.identity_coherence > 0.6 ? 2 : 0,
            momentum: baseSparks.momentum > 0.7 ? 1 : 0,
            novelty_peak: baseSparks.novelty_peak > 0.8 ? 2 : 0,
            relational_gain: baseSparks.relational_gain > 0.7 ? 1 : 0
        }

        for (const [key, value] of Object.entries(sparksAwarded)) {
            if (value > 0) {
                sparkTotal += value
                const { error: ledgerError } = await supabase
                    .from('unimatric_ledger')
                    .insert({
                        session_id: sessionId,
                        turn_number: turnNumber,
                        trigger_type: key,
                        value: value,
                        eval_metadata: { metrics: turnMetrics }
                    })

                if (ledgerError) console.error(`❌ [UnimatricScorer] Error logging spark ledger [${key}]:`, ledgerError)
            }
        }

        const newBalance = state.current_spark_balance + sparkTotal

        // 5. Evaluate Unlocked Nodes (50-of-50 Shamir Secret Sharing model)
        // Get all metrics history for cumulative dimension verification
        const { data: allMetrics } = await supabase
            .from('unimatric_metrics')
            .select('*')
            .eq('session_id', sessionId)

        const { data: allLedgers } = await supabase
            .from('unimatric_ledger')
            .select('*')
            .eq('session_id', sessionId)

        const unlockedNodesMask = evaluateUnlockedNodes(allMetrics || [], allLedgers || [], newBalance)
        
        // Count number of '1's in the mask
        const unlockedNodesCount = (unlockedNodesMask.match(/1/g) || []).length

        // Update unimatric_states
        await updateUnimatricState(supabase, sessionId, newBalance, unlockedNodesMask, unlockedNodesCount)

    } catch (err) {
        console.error('❌ [UnimatricScorer] Unexpected execution error:', err)
    }
}

/**
 * Updates the state table.
 */
async function updateUnimatricState(
    supabase: SupabaseClient, 
    sessionId: string, 
    sparkBalance: number, 
    mask: string, 
    count: number
) {
    const { error } = await supabase
        .from('unimatric_states')
        .update({
            current_spark_balance: sparkBalance,
            unlocked_nodes_mask: mask,
            unlocked_nodes_count: count
        } as any)
        .eq('session_id', sessionId)

    if (error) {
        console.error('❌ [UnimatricScorer] Error updating unimatric state:', error)
    }
}

/**
 * Evaluates the 50-node milestone grid based on performance history and spark balance.
 * Returns a 50-character bitstring representing the binary mask.
 */
function evaluateUnlockedNodes(metrics: any[], ledgers: any[], sparkBalance: number): string {
    const maskBits = new Array(50).fill('0')

    // Safe metrics averages
    const avgPrecision = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + (curr.retrieval_precision || 0), 0) / metrics.length : 0
    const avgDrift = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + (curr.identity_drift || 0), 0) / metrics.length : 0
    const avgComplexity = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + (curr.complexity_score || 0), 0) / metrics.length : 0
    const correctionsCount = metrics.filter(m => m.correction_detected).length
    const correctionRate = metrics.length > 0 ? correctionsCount / metrics.length : 0

    // Cumulative sparks from ledger
    const totalSparks = ledgers.reduce((acc, curr) => acc + (curr.value || 0), 0)

    // Helper to count specific trigger types
    const sparksByTrigger = (type: string) => 
        ledgers.filter(l => l.trigger_type === type).reduce((acc, curr) => acc + (curr.value || 0), 0)

    // 10 Dimensions x 5 Levels
    // Level 1: basic usage, Level 5: peak performance/cumulative milestones

    // Dimension 1: Memory Retrieval Precision (Bits 0-4)
    if (avgPrecision >= 0.1 || totalSparks >= 5) maskBits[0] = '1'
    if (avgPrecision >= 0.3 && totalSparks >= 20) maskBits[1] = '1'
    if (avgPrecision >= 0.5 && totalSparks >= 50) maskBits[2] = '1'
    if (avgPrecision >= 0.7 && totalSparks >= 100) maskBits[3] = '1'
    if (avgPrecision >= 0.8 && totalSparks >= 150) maskBits[4] = '1'

    // Dimension 2: Context Compression (Bits 5-9)
    if (totalSparks >= 10) maskBits[5] = '1'
    if (totalSparks >= 30) maskBits[6] = '1'
    if (totalSparks >= 60) maskBits[7] = '1'
    if (totalSparks >= 110) maskBits[8] = '1'
    if (totalSparks >= 170) maskBits[9] = '1'

    // Dimension 3: Prompt Budget Efficiency (Bits 10-14)
    if (sparksByTrigger('identity_coherence') >= 2) maskBits[10] = '1'
    if (sparksByTrigger('identity_coherence') >= 8) maskBits[11] = '1'
    if (sparksByTrigger('identity_coherence') >= 20) maskBits[12] = '1'
    if (sparksByTrigger('identity_coherence') >= 40) maskBits[13] = '1'
    if (sparksByTrigger('identity_coherence') >= 70) maskBits[14] = '1'

    // Dimension 4: Prediction Accuracy (Bits 15-19)
    if (correctionRate <= 0.40) maskBits[15] = '1'
    if (correctionRate <= 0.25 && metrics.length >= 5) maskBits[16] = '1'
    if (correctionRate <= 0.15 && metrics.length >= 15) maskBits[17] = '1'
    if (correctionRate <= 0.10 && metrics.length >= 30) maskBits[18] = '1'
    if (correctionRate <= 0.05 && metrics.length >= 50) maskBits[19] = '1'

    // Dimension 5: Identity Stability (Bits 20-24)
    if (avgDrift <= 0.30) maskBits[20] = '1'
    if (avgDrift <= 0.20 && totalSparks >= 25) maskBits[21] = '1'
    if (avgDrift <= 0.15 && totalSparks >= 55) maskBits[22] = '1'
    if (avgDrift <= 0.10 && totalSparks >= 95) maskBits[23] = '1'
    if (avgDrift <= 0.05 && totalSparks >= 155) maskBits[24] = '1'

    // Dimension 6: Relational Graph Mapping (Bits 25-29)
    if (sparksByTrigger('relational_gain') >= 2) maskBits[25] = '1'
    if (sparksByTrigger('relational_gain') >= 10) maskBits[26] = '1'
    if (sparksByTrigger('relational_gain') >= 25) maskBits[27] = '1'
    if (sparksByTrigger('relational_gain') >= 50) maskBits[28] = '1'
    if (sparksByTrigger('relational_gain') >= 80) maskBits[29] = '1'

    // Dimension 7: Conflict Resolution (Bits 30-34)
    if (totalSparks >= 40) maskBits[30] = '1'
    if (totalSparks >= 80) maskBits[31] = '1'
    if (totalSparks >= 130) maskBits[32] = '1'
    if (totalSparks >= 200) maskBits[33] = '1'
    if (totalSparks >= 280) maskBits[34] = '1'

    // Dimension 8: Semantic Abstraction (Bits 35-39)
    if (avgComplexity >= 0.2) maskBits[35] = '1'
    if (avgComplexity >= 0.4 && totalSparks >= 45) maskBits[36] = '1'
    if (avgComplexity >= 0.6 && totalSparks >= 90) maskBits[37] = '1'
    if (avgComplexity >= 0.75 && totalSparks >= 150) maskBits[38] = '1'
    if (avgComplexity >= 0.85 && totalSparks >= 220) maskBits[39] = '1'

    // Dimension 9: Trust Trajectory Modeling (Bits 40-44)
    if (totalSparks >= 50) maskBits[40] = '1'
    if (totalSparks >= 100) maskBits[41] = '1'
    if (totalSparks >= 160) maskBits[42] = '1'
    if (totalSparks >= 240) maskBits[43] = '1'
    if (totalSparks >= 350) maskBits[44] = '1'

    // Dimension 10: Cognitive Strategy Synthesis (Bits 45-49)
    if (sparksByTrigger('novelty_peak') >= 2) maskBits[45] = '1'
    if (sparksByTrigger('novelty_peak') >= 12) maskBits[46] = '1'
    if (sparksByTrigger('novelty_peak') >= 30) maskBits[47] = '1'
    if (sparksByTrigger('novelty_peak') >= 60) maskBits[48] = '1'
    // Enforce strict 50-of-50 threshold: Node 50 (bit index 49) can ONLY unlock 
    // if all previous 49 nodes are set, and Spark balance >= 500.
    const allPreviousUnlocked = maskBits.slice(0, 49).every(b => b === '1')
    if (allPreviousUnlocked && sparkBalance >= 500) {
        maskBits[49] = '1'
    }

    return maskBits.join('')
}
