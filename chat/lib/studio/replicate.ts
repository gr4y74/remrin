import Replicate from "replicate";
import { AetherService } from "./aether";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export class ReplicateService {
    /**
     * Initiates an image/video generation.
     */
    static async startGeneration(supabase: any, userId: string, modelData: any, prompt: string, params: any) {
        const aetherCost = modelData.aether_cost;

        // 1. Deduct credits
        await AetherService.deductCredits(supabase, userId, aetherCost);

        try {
            // 2. Create generation record in DB
            const { data: generation, error: dbError } = await supabase
                .from('generations')
                .insert({
                    user_id: userId,
                    model_id: modelData.id,
                    prompt,
                    parameters: params,
                    aether_spent: aetherCost,
                    status: 'processing'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Start Replicate prediction
            // Note: Replicate model names are formatted as 'owner/name:version' or just 'owner/name'
            const prediction = await replicate.predictions.create({
                version: modelData.model_version || undefined, // Some models require version, others use model_id
                model: modelData.model_id,
                input: {
                    prompt,
                    ...params
                },
                // webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/studio/webhook`, // Optional for async
            });

            // 4. Update generation with prediction ID
            await supabase
                .from('generations')
                .update({ replicate_prediction_id: prediction.id })
                .eq('id', generation.id);

            return {
                id: generation.id,
                prediction_id: prediction.id,
                status: prediction.status
            };

        } catch (error: any) {
            // Refund on failure to start
            await AetherService.refundCredits(supabase, userId, aetherCost);
            console.error("Replicate start error:", error);
            throw error;
        }
    }

    /**
     * Checks status and updates DB.
     */
    static async checkStatus(supabase: any, generationId: string, predictionId: string) {
        const prediction = await replicate.predictions.get(predictionId);

        let status = 'processing';
        if (prediction.status === 'succeeded') status = 'completed';
        if (prediction.status === 'failed') status = 'failed';
        if (prediction.status === 'canceled') status = 'cancelled';

        const outputUrl = prediction.output ?
            (Array.isArray(prediction.output) ? prediction.output[0] : prediction.output) :
            null;

        await supabase
            .from('generations')
            .update({
                status,
                output_url: outputUrl,
                error_message: prediction.error ? String(prediction.error) : null
            })
            .eq('id', generationId);

        return {
            status,
            output_url: outputUrl,
            error: prediction.error
        };
    }
}
