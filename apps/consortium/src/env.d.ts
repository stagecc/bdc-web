/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import('jose').JWTPayload | null;
  }
}
