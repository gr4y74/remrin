# Media Manager Enhancements

## Overview
The Media Manager (`/admin/media`) has been enhanced with new features to manage character media assets more effectively.

## New Features

### 1. Background Image Upload
- Upload custom background images for each character
- Backgrounds are stored in the `persona_backgrounds` storage bucket
- Preview backgrounds before setting them
- Remove backgrounds with a single click

### 2. Set as Default Media
- Mark character media (avatar, video, background) as "default"
- Default media persists across server restarts
- Indicated by a gold star icon (⭐) in the character list
- Ensures community characters maintain their intended appearance

### 3. Delete Character
- Safely delete characters from the admin panel
- Confirmation dialog prevents accidental deletions
- Cascade deletion removes all associated data (chats, moments, etc.)
- Useful for removing unwanted or test characters

## Usage

### Setting Default Media
1. Navigate to `/admin/media`
2. Select a character from the list
3. Upload avatar, video, and/or background images
4. Click "Set as Default" button
5. The character's media will now persist across server restarts

### Uploading Background Images
1. Select a character
2. Scroll to the "Background Image" section
3. Click "Upload Background"
4. Choose an image file (recommended: 16:9 or wider)
5. The background will be displayed in the preview area

### Deleting a Character
1. Select the character you want to delete
2. Click the "Delete Character" button (red, with trash icon)
3. Confirm the deletion in the dialog
4. The character and all associated data will be permanently removed

## Database Changes

### New Columns
- `personas.background_url` (TEXT): URL to the background image
- `personas.is_default_media_set` (BOOLEAN): Flag for default media persistence

### New Storage Bucket
- `persona_backgrounds`: Public bucket for character background images

## Migration

Run the migration file to add the new columns:
```sql
-- File: supabase/migrations/20260108_add_persona_media_enhancements.sql
```

Or manually run:
```sql
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS background_url TEXT,
ADD COLUMN IF NOT EXISTS is_default_media_set BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### DELETE /api/admin/personas/[personaId]
Deletes a persona and all associated data.

**Authentication**: Required
**Response**: 
- 200: `{ success: true }`
- 401: `{ error: 'Unauthorized' }`
- 500: `{ error: 'Failed to delete persona' }`

## UI Indicators

- **Video Icon** (top-right of thumbnail): Character has a video
- **Gold Star** (bottom-right of thumbnail): Media is set as default

## Best Practices

1. **Always set community characters as default** to ensure consistency
2. **Test uploads** with small files first to verify bucket permissions
3. **Backup important characters** before deletion
4. **Use appropriate image sizes** to optimize loading times:
   - Avatar: 512x512px or 1:1 ratio
   - Background: 1920x1080px or 16:9 ratio
   - Video: 1080x1920px or 9:16 ratio (portrait)

## Troubleshooting

### Upload Fails
- Ensure storage buckets exist: `persona_images`, `persona_videos`, `persona_backgrounds`
- Check bucket permissions are set to public
- Verify file size is under Supabase limits (50MB for free tier)

### Default Media Not Persisting
- Ensure `is_default_media_set` column exists in database
- Check that the "Set as Default" button was clicked
- Verify the flag is saved in the database

### Delete Fails
- Check for foreign key constraints
- Ensure user has proper permissions
- Review server logs for specific error messages
