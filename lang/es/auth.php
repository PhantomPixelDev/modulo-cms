<?php

return [
    // Login
    'login' => [
        'title' => 'Log In',
        'welcome_back' => 'Welcome back',
        'description' => 'Enter your credentials to access your account.',
        'email' => 'Email Address',
        'password' => 'Password',
        'remember' => 'Remember me',
        'forgot_password' => 'Forgot your password?',
        'login_button' => 'Log In',
        'no_account' => 'Don\'t have an account?',
        'sign_up' => 'Sign up',
        'logging_in' => 'Logging in...',
    ],

    // Registration
    'register' => [
        'title' => 'Create Account',
        'description' => 'Fill in your details to create a new account.',
        'name' => 'Full Name',
        'email' => 'Email Address',
        'password' => 'Password',
        'confirm_password' => 'Confirm Password',
        'register_button' => 'Create Account',
        'have_account' => 'Already have an account?',
        'sign_in' => 'Sign in',
        'registering' => 'Creating account...',
        'terms_agree' => 'I agree to the :terms and :privacy',
        'terms' => 'Terms of Service',
        'privacy' => 'Privacy Policy',
    ],

    // Password reset
    'password' => [
        'forgot_title' => 'Forgot Password',
        'forgot_description' => 'Enter your email and we\'ll send you a link to reset your password.',
        'reset_title' => 'Reset Password',
        'reset_description' => 'Enter your new password below.',
        'email' => 'Email Address',
        'send_link' => 'Send Reset Link',
        'new_password' => 'New Password',
        'confirm_password' => 'Confirm Password',
        'reset_button' => 'Reset Password',
        'back_to_login' => 'Back to login',
        'link_sent' => 'We have emailed your password reset link.',
        'reset_success' => 'Your password has been reset.',
        'sending' => 'Sending...',
        'resetting' => 'Resetting...',
    ],

    // Email verification
    'verify' => [
        'title' => 'Verify Email',
        'description' => 'Thanks for signing up! Before getting started, please verify your email address by clicking on the link we just emailed to you.',
        'resend' => 'Resend Verification Email',
        'check_email' => 'Please check your email for a verification link.',
        'link_sent' => 'A new verification link has been sent to your email address.',
        'verified' => 'Your email has been verified.',
    ],

    // Confirm password
    'confirm' => [
        'title' => 'Confirm Password',
        'description' => 'This is a secure area of the application. Please confirm your password before continuing.',
        'password' => 'Password',
        'confirm_button' => 'Confirm',
        'confirming' => 'Confirming...',
    ],

    // Logout
    'logout' => [
        'title' => 'Log Out',
        'confirm' => 'Are you sure you want to log out?',
        'button' => 'Log Out',
        'success' => 'You have been logged out.',
    ],

    // Profile
    'profile' => [
        'title' => 'Profile',
        'edit_profile' => 'Edit Profile',
        'update_info' => 'Update Profile Information',
        'update_info_description' => 'Update your account\'s profile information and email address.',
        'update_password' => 'Update Password',
        'update_password_description' => 'Ensure your account is using a long, random password to stay secure.',
        'current_password' => 'Current Password',
        'new_password' => 'New Password',
        'confirm_password' => 'Confirm Password',
        'delete_account' => 'Delete Account',
        'delete_account_description' => 'Once your account is deleted, all of its resources and data will be permanently deleted.',
        'delete_confirm' => 'Are you sure you want to delete your account? This action cannot be undone.',
        'profile_updated' => 'Profile updated successfully.',
        'password_updated' => 'Password updated successfully.',
    ],

    // Validation messages
    'failed' => 'These credentials do not match our records.',
    'password_incorrect' => 'The provided password is incorrect.',
    'throttle' => 'Too many login attempts. Please try again in :seconds seconds.',
];
