import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const imageType = formData.get('type') as string; // 'avatar' or 'banner'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${imageType || 'image'}-${Date.now()}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars') // Make sure this bucket exists in your Supabase project
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with new image URL
        const updateField = imageType === 'banner' ? 'hero_image_url' : 'image_url';
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                [updateField]: publicUrl,
                image_path: filePath,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            // Try to delete the uploaded file
            await supabase.storage.from('avatars').remove([filePath]);

            return NextResponse.json(
                { error: 'Failed to update profile' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: filePath,
        });
    } catch (error) {
        console.error('Error in POST /api/profile/upload-image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');

        if (!imagePath) {
            return NextResponse.json(
                { error: 'No image path provided' },
                { status: 400 }
            );
        }

        // Delete from storage
        const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([imagePath]);

        if (deleteError) {
            console.error('Error deleting file:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete file' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error in DELETE /api/profile/upload-image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
