-- RLS Policies for Financial Transactions
-- This file adds the necessary Row Level Security policies to allow proper access to financial_transactions table

-- Create policies for financial_transactions table
CREATE POLICY "Authenticated users can view financial transactions" ON financial_transactions 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert financial transactions" ON financial_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'treasurer', 'secretary')
  )
);

CREATE POLICY "Staff can update financial transactions" ON financial_transactions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'treasurer')
  )
);

CREATE POLICY "Admins can delete financial transactions" ON financial_transactions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor')
  )
);

-- Also add policies for departments table if they don't exist
DO $$
BEGIN
  -- Check if departments policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'departments' 
    AND policyname = 'Authenticated users can view departments'
  ) THEN
    CREATE POLICY "Authenticated users can view departments" ON departments 
    FOR SELECT 
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'departments' 
    AND policyname = 'Staff can manage departments'
  ) THEN
    CREATE POLICY "Staff can manage departments" ON departments 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor', 'secretary')
      )
    );
  END IF;
END $$;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('financial_transactions', 'departments', 'members', 'profiles')
ORDER BY tablename, policyname;