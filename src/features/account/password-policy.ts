// Client feedback only. The backend independently validates every password change.
import { z } from 'zod';
export const PASSWORD_MAX_LENGTH = 1024;
export const passwordPolicyHint = 'At least 9 characters.';
export const passwordInput = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(9).max(PASSWORD_MAX_LENGTH),
}).refine(input => input.currentPassword !== input.newPassword, { message: 'Choose a different password.', path: ['newPassword'] });
