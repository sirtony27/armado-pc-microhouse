-- Run this in the Supabase SQL Editor to allow 'NOTEBOOK' type

ALTER TABLE componentes DROP CONSTRAINT IF EXISTS componentes_tipo_check;

ALTER TABLE componentes ADD CONSTRAINT componentes_tipo_check 
CHECK (tipo IN (
    'CPU', 
    'GPU', 
    'RAM', 
    'ALMACENAMIENTO', 
    'PLACA_MADRE', 
    'FUENTE', 
    'GABINETE', 
    'MONITOR', 
    'PC_ARMADA',
    'NOTEBOOK'
));
