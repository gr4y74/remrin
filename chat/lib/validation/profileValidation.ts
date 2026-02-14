import { z } from 'zod';

// Display name validation: 1-50 chars, letters, numbers, spaces, and common punctuation
export const displayNameSchema = z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .regex(
        /^[a-zA-Z0-9\s\-_.,']+$/,
        'Display name can only contain letters, numbers, spaces, and basic punctuation'
    );

// Bio validation: 0-500 chars
export const bioSchema = z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .nullable();

// Website validation: Valid URL
export const websiteSchema = z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .or(z.literal(''));

// Location validation: 0-100 chars
export const locationSchema = z
    .string()
    .max(100, 'Location must be 100 characters or less')
    .optional()
    .nullable();

// Username validation: 3-30 chars, alphanumeric and underscores
export const usernameSchema = z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
    );

// Pronouns validation: MALE or FEMALE only
export const pronounsSchema = z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Please select valid pronouns' }),
});

// Email validation
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address');

// Password validation: at least 6 characters
export const passwordSchema = z
    .string()
    .min(6, 'Password must be at least 6 characters');

// Complete profile update schema
export const profileUpdateSchema = z.object({
    display_name: displayNameSchema.optional(),
    bio: bioSchema,
    username: usernameSchema.optional(),
    image_url: z.string().url().optional().nullable(),
    image_path: z.string().optional().nullable(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
});

// Validation helper functions
export const validateField = (
    fieldName: string,
    value: string
): string | null => {
    try {
        switch (fieldName) {
            case 'display_name':
                displayNameSchema.parse(value);
                break;
            case 'bio':
                bioSchema.parse(value);
                break;
            case 'website':
                websiteSchema.parse(value);
                break;
            case 'location':
                locationSchema.parse(value);
                break;
            case 'username':
                usernameSchema.parse(value);
                break;
            case 'pronouns':
                pronounsSchema.parse(value);
                break;
            default:
                return null;
        }
        return null;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return error.errors[0]?.message || 'Invalid input';
        }
        return 'Validation error';
    }
};
