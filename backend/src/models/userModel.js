import { supabase } from '../config/supabase.js';

// Sign up new user
export const signUpUser = async (email, password, businessName) => {
  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        business_name: businessName
      }
    }
  });

  if (error) throw error;

 await supabase.from('profiles').insert({
  user_id: data.user.id,
  business_name: businessName
});
  return {
    user: data.user,
    session: data.session
  };
};