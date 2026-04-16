-- Script SQL pour mettre à jour les catégories existantes avec les nouveaux prefix
-- Compatible avec PostgreSQL

-- Supprimer toutes les catégories existantes (en cascade)
DELETE FROM categories;

-- Insérer les nouvelles catégories avec les prefix corrects
INSERT INTO categories (id, name, description, color, prefix, estimated_duration, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Matériaux bâtiment', 'Béton, ciment, agrégats, matériaux de construction', '#3B82F6', 'BATIMENT', 30, true, NOW(), NOW()),
  (gen_random_uuid(), 'Infrastructure', 'Matériaux pour infrastructure et travaux publics', '#F59E0B', 'INFRA', 25, true, NOW(), NOW()),
  (gen_random_uuid(), 'Électricité', 'Matériaux électriques, poteaux, câbles', '#EF4444', 'ELECT', 35, true, NOW(), NOW());
