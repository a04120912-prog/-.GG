import { createClient } from '@supabase/supabase-js'

// 기존 입력 사이트에서 썼던 URL과 anon public Key를 그대로 넣으세요.
const supabaseUrl = 'https://aafpqggkbbjgzlmriubh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZnBxZ2drYmJqZ3psbXJpdWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTE3ODUsImV4cCI6MjA4OTM4Nzc4NX0.BfmhcgYEH4Q7HiAxjffo8MtRVJ5b7MFCW1iYA-nRrdU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)