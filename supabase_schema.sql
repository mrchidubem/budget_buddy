-- Budget Buddy Supabase Database Schema

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    income DECIMAL(10,2) NOT NULL,
    expenses JSONB NOT NULL,
    savings DECIMAL(10,2) NOT NULL,
    savings_rate DECIMAL(5,2) NOT NULL,
    savings_goal DECIMAL(10,2) DEFAULT 0,
    category_breakdown JSONB NOT NULL,
    advice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (you can modify this for authenticated users)
CREATE POLICY "Allow anonymous access" ON budgets
    FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO budgets (user_id, income, expenses, savings, savings_rate, category_breakdown, advice) 
VALUES (
    'anonymous',
    5000.00,
    '[{"name": "Rent", "amount": 1500, "category": "housing"}, {"name": "Food", "amount": 800, "category": "food"}]',
    2700.00,
    54.00,
    '{"housing": 1500, "food": 800}',
    'Great job! You are saving over 50% of your income. Consider investing some of your savings.'
) ON CONFLICT DO NOTHING;
