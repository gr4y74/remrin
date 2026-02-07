Project Overview:
Build a comprehensive AI image and video generation studio interface that integrates with Replicate API, allowing users to select models, customize generation parameters, and manage their creations using an Aether-based credit system.
Visual Design Reference:
The UI should replicate the DeepAI interface (see attached screenshots) with the following design elements:

Color Scheme: Rose Pine theme, purple accent buttons (#7c3aed), subtle card backgrounds
Layout: Left panel for controls, right panel for preview/results
Typography: Clean, modern sans-serif
Component Style: Rounded corners, subtle shadows, high contrast for readability


IMPLEMENTATION PLAN
PHASE 1: Backend Infrastructure
1.1 Database Schema
Create new tables:
sql-- Model definitions table
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL, -- Replicate model identifier
  type TEXT NOT NULL, -- 'image' or 'video'
  display_name TEXT NOT NULL,
  description TEXT,
  base_cost DECIMAL(10,4) NOT NULL, -- Replicate cost
  aether_cost INTEGER NOT NULL, -- User-facing cost (2x base minimum)
  thumbnail_url TEXT,
  sample_outputs JSONB, -- Array of sample image URLs
  parameters JSONB, -- Available parameters for this model
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation history table
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  model_id UUID REFERENCES ai_models(id),
  prompt TEXT NOT NULL,
  parameters JSONB, -- Settings used (style, size, etc.)
  output_url TEXT,
  aether_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  replicate_prediction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
1.2 Seed Models Data
Populate ai_models table with:
Image Models:

Flux Schnell (black-forest-labs/flux-schnell)
Flux Dev (black-forest-labs/flux-dev)
Flux Pro (black-forest-labs/flux-pro)
Flux 1.1 Pro (black-forest-labs/flux-1.1-pro)
SDXL (stability-ai/sdxl)
Add 5-10 more popular models with varying styles

Video Models:

Seedance-1-Pro (bytedance/seedance-1-pro)
Luma AI Dream Machine
Runway Gen-3
Add 3-5 more video models

For each model, include:

Accurate Replicate model ID
Current pricing from Replicate
Aether cost (minimum 2x, rounded to nice numbers)
Sample output URLs
Available parameters (aspect ratio, quality, steps, etc.)


PHASE 2: Backend API Endpoints
2.1 Model Management
typescript// GET /api/studio/models?type=image
// Returns list of available models with metadata

// GET /api/studio/models/:id
// Returns specific model details including samples
2.2 Generation Endpoints
typescript// POST /api/studio/generate
{
  model_id: "uuid",
  prompt: "string",
  parameters: {
    aspect_ratio: "16:9",
    quality: "hd",
    style: "anime",
    // ... other model-specific params
  }
}

// Response:
{
  generation_id: "uuid",
  status: "pending",
  aether_cost: 100
}

// GET /api/studio/generation/:id
// Poll for generation status and result
2.3 Replicate Integration
Create service layer:
typescriptclass ReplicateService {
  async generateImage(modelId: string, prompt: string, params: object) {
    // 1. Validate user has enough Aether
    // 2. Deduct Aether from user account
    // 3. Call Replicate API with model + params
    // 4. Store prediction ID in database
    // 5. Return generation_id to client
  }
  
  async checkStatus(predictionId: string) {
    // Poll Replicate for status
    // Update database when complete
    // Store output URL
  }
  
  async handleWebhook(payload: object) {
    // Handle Replicate webhooks for completion
  }
}

PHASE 3: Frontend Components
3.1 Main Studio Page Structure
tsx<StudioPage>
  <StudioHeader /> {/* Tab switcher: Image | Video | Edit */}
  
  <div className="studio-container grid grid-cols-[400px_1fr]">
    {/* LEFT PANEL */}
    <StudioControls>
      <PromptInput />
      <ModelSelector />
      <ParameterControls />
      <GenerateButton />
    </StudioControls>
    
    {/* RIGHT PANEL */}
    <StudioPreview>
      <PreviewArea />
      <GenerationHistory />
    </StudioPreview>
  </div>
</StudioPage>
3.2 Key Components
ModelSelector Component:
tsx<ModelSelector>
  {/* Tabs: HD | Genius | Super Genius (quality tiers) */}
  <QualityTabs />
  
  {/* Grid of model cards with thumbnails */}
  <ModelGrid>
    {models.map(model => (
      <ModelCard 
        name={model.display_name}
        thumbnail={model.thumbnail_url}
        aetherCost={model.aether_cost}
        selected={selectedModel === model.id}
        onClick={() => setSelectedModel(model.id)}
      />
    ))}
  </ModelGrid>
  
  {/* View all models modal */}
  <ViewAllButton />
</ModelSelector>
ParameterControls Component:
tsx<ParameterControls model={selectedModel}>
  {/* Dynamic based on selected model's parameters */}
  
  {/* Common controls */}
  <PreferenceToggle options={["Speed", "Quality"]} />
  
  {/* Style selector with thumbnails */}
  <StyleSelector styles={model.availableStyles} />
  
  {/* Aspect ratio / shape selector */}
  <ShapeSelector />
  
  {/* Advanced settings accordion */}
  <AdvancedSettings>
    <Steps />
    <GuidanceScale />
    <Seed />
  </AdvancedSettings>
</ParameterControls>
GenerateButton Component:
tsx<GenerateButton 
  onClick={handleGenerate}
  disabled={!prompt || generating}
  aetherCost={selectedModel.aether_cost}
>
  {generating ? (
    <Spinner />
  ) : (
    <>
      Generate ({selectedModel.aether_cost} Aether)
    </>
  )}
</GenerateButton>
PreviewArea Component:
tsx<PreviewArea>
  {status === 'idle' && <PlaceholderGraphic />}
  
  {status === 'generating' && (
    <LoadingState>
      <ProgressBar />
      <EstimatedTime model={selectedModel} />
    </LoadingState>
  )}
  
  {status === 'complete' && (
    <GeneratedImage>
      <img src={outputUrl} />
      <ActionBar>
        <DownloadButton />
        <ShareButton />
        <EditButton /> {/* Phase 4 */}
        <RegenerateButton />
      </ActionBar>
    </GeneratedImage>
  )}
</PreviewArea>

PHASE 4: Image Editing Feature (like DeepAI's edit mode)
4.1 Edit Mode UI
tsx<EditMode originalImage={imageUrl}>
  {/* Upload area for reference images */}
  <ImageUploader maxImages={3} />
  
  {/* Text description of edits */}
  <EditPromptInput 
    placeholder="Describe your changes (e.g., 'add a purple hoodie')"
  />
  
  {/* Model selector (Standard, Genius, Super Genius) */}
  <EditModelSelector />
  
  {/* Side-by-side preview */}
  <ComparisonView>
    <div className="original">
      <img src={originalImage} />
      <label>Original</label>
    </div>
    <div className="edited">
      <img src={editedImage} />
      <label>Edited</label>
    </div>
  </ComparisonView>
  
  <GenerateButton text="Apply Edits" />
</EditMode>
4.2 Edit API
typescript// POST /api/studio/edit
{
  base_image_url: "string",
  reference_images: ["url1", "url2"], // optional
  edit_prompt: "string",
  model_id: "uuid"
}

PHASE 5: Video Generation
5.1 Video Tab Components
tsx<VideoStudio>
  <div className="tabs">
    <Tab>Text to Video</Tab>
    <Tab>Image to Video</Tab>
  </div>
  
  {activeTab === 'text' && (
    <TextToVideo>
      <PromptInput large />
      <ModeSelector>
        <Option name="Hollywood Mode" description="High-definition 8 second videos" />
        <Option name="Olde Mode" description="Classic video generation" />
      </ModeSelector>
      <DurationSelector options={["5 sec", "10 sec"]} />
      <AspectRatioSelector />
    </TextToVideo>
  )}
  
  {activeTab === 'image' && (
    <ImageToVideo>
      <ImageUploader />
      <MotionPrompt placeholder="Describe the motion..." />
      <DurationSelector />
    </ImageToVideo>
  )}
  
  <VideoPreview>
    <video controls src={generatedVideoUrl} />
  </VideoPreview>
</VideoStudio>

PHASE 6: Aether Integration
6.1 Cost Display

Show Aether cost on every generate button
Display user's current Aether balance in header
Warning modal if insufficient Aether
Link to purchase/earn more Aether

6.2 Pricing Logic
typescriptconst calculateAetherCost = (replicateCost: number): number => {
  // Minimum 2x markup
  const baseCost = Math.ceil(replicateCost * 2);
  
  // Round to nice numbers (5, 10, 25, 50, 100, etc.)
  if (baseCost < 10) return Math.ceil(baseCost / 5) * 5;
  if (baseCost < 100) return Math.ceil(baseCost / 10) * 10;
  if (baseCost < 500) return Math.ceil(baseCost / 25) * 25;
  return Math.ceil(baseCost / 50) * 50;
};
6.3 Transaction Flow

User clicks Generate
Check Aether balance
Create pending transaction
Deduct Aether
Call Replicate
If fails: refund Aether
If succeeds: mark transaction complete


PHASE 7: Polish & Features
7.1 Generation History

Grid of past generations
Filter by date, model, type
Quick re-generate with same settings
Delete/archive options

7.2 Sample Gallery

For each model, show 4-6 sample outputs
Click to use as inspiration
"Try this prompt" button

7.3 Responsive Design

Mobile: Stack controls above preview
Tablet: Adjust grid to single column
Desktop: Side-by-side layout

7.4 Error Handling

Replicate API errors
Timeout handling (show estimated time)
Inappropriate content detection
Network failures with retry

7.5 Optimization

Image lazy loading
Thumbnail generation
CDN for generated outputs
Webhook-based status updates (vs polling)


TECHNICAL REQUIREMENTS
Stack:

Frontend: Next.js 14+, TypeScript, Tailwind CSS
Backend: Supabase Edge Functions or Next.js API routes
Database: PostgreSQL (Supabase)
File Storage: Supabase Storage or Cloudflare R2
API: Replicate API

Dependencies:
json{
  "replicate": "^0.30.0",
  "react-dropzone": "^14.2.3", // For image uploads
  "framer-motion": "^11.0.0", // For animations
  "react-compare-image": "^3.4.0" // For before/after editing
}
```

### **Environment Variables:**
```
REPLICATE_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key

DEVELOPMENT PHASES
Phase 1 (Week 1):

Database schema
Seed models data
Basic API endpoints
Replicate integration service

Phase 2 (Week 2):

Frontend component structure
Model selector UI
Basic generation flow
Aether integration

Phase 3 (Week 3):

Parameter controls
Video generation
Generation history
Polish & styling

Phase 4 (Week 4):

Image editing feature
Sample galleries
Error handling
Testing & optimization


SUCCESS CRITERIA
✅ Users can select from 15+ image models and 5+ video models
✅ All model parameters are configurable via UI
✅ Generations complete in <60 seconds for images, <5 minutes for videos
✅ Aether costs are clearly displayed and accurately charged
✅ UI matches DeepAI aesthetic (dark navy, purple accents)
✅ Mobile responsive
✅ Generation success rate >95%
✅ Image editing works with multi-image references
