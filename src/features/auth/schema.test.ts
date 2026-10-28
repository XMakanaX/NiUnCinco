import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordRequestSchema, updatePasswordSchema } from './schema';

describe('loginSchema', () => {
  it('acepta correo y contraseña válidos', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rechaza correo inválido', () => {
    expect(loginSchema.safeParse({ email: 'no-es-correo', password: 'x' }).success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('acepta cuando las contraseñas coinciden y cumplen el mínimo', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza contraseñas que no coinciden', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password2',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseña menor a 8 caracteres', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordRequestSchema', () => {
  it('rechaza correo vacío', () => {
    expect(resetPasswordRequestSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('updatePasswordSchema', () => {
  it('rechaza cuando las contraseñas no coinciden', () => {
    const result = updatePasswordSchema.safeParse({ password: 'password1', confirmPassword: 'password2' });
    expect(result.success).toBe(false);
  });
});
