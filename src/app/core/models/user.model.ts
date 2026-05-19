export interface User {
  id?: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  rol: 'productor' | 'asociacion' | 'institucion' | 'admin';
  plan: 'basico' | 'plus' | 'asociacion' | 'institucional';
  estado: 'activo' | 'inactivo' | 'suspendido';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  telefono?: string;
  rol: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

// El backend devuelve solo token + rol + plan en el login
export interface LoginResponse {
  token: string;
  rol: string;
  plan: string;
}

// El register devuelve solo el id creado
export interface RegisterResponse {
  id: string;
}
