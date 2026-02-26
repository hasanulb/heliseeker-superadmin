-- Migration: Create clientele management tables
-- Description: Tables for managing client logo groups and individual client logos with ordering support
-- Created: 2025-09-16

-- Create clientele_groups table
CREATE TABLE IF NOT EXISTS clientele_groups (
    group_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_logos table
CREATE TABLE IF NOT EXISTS client_logos (
    client_logo_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    img_url TEXT NOT NULL,
    group_id UUID NOT NULL REFERENCES clientele_groups(group_id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clientele_groups_order ON clientele_groups(order_index);
CREATE INDEX IF NOT EXISTS idx_client_logos_group_id ON client_logos(group_id);
CREATE INDEX IF NOT EXISTS idx_client_logos_order ON client_logos(group_id, order_index);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_clientele_groups_updated_at
    BEFORE UPDATE ON clientele_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_logos_updated_at
    BEFORE UPDATE ON client_logos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for additional security
ALTER TABLE clientele_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_logos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users only
-- Note: Adjust these policies based on your specific authentication setup

-- Policy for clientele_groups: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users on clientele_groups" ON clientele_groups
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy for client_logos: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users on client_logos" ON client_logos
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant necessary permissions
-- Note: Adjust role names based on your Supabase setup
GRANT ALL ON clientele_groups TO authenticated;
GRANT ALL ON client_logos TO authenticated;
GRANT USAGE ON SEQUENCE clientele_groups_group_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE client_logos_client_logo_id_seq TO authenticated;