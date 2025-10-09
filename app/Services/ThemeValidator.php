<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class ThemeValidator
{
    protected array $requiredFields = ['name', 'slug', 'version'];
    protected array $errors = [];

    /**
     * Validate theme configuration
     */
    public function validate(array $config, string $themePath): bool
    {
        $this->errors = [];

        $this->validateRequiredFields($config);
        $this->validateSlug($config);
        $this->validateVersion($config);
        $this->validateReactTemplates($config, $themePath);

        return empty($this->errors);
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Get errors as string
     */
    public function getErrorsAsString(): string
    {
        return implode(', ', $this->errors);
    }

    /**
     * Validate required fields
     */
    protected function validateRequiredFields(array $config): void
    {
        foreach ($this->requiredFields as $field) {
            if (!isset($config[$field]) || empty($config[$field])) {
                $this->errors[] = "Missing required field: {$field}";
            }
        }
    }


    /**
     * Validate slug format
     */
    protected function validateSlug(array $config): void
    {
        if (isset($config['slug']) && !preg_match('/^[a-z0-9\-]+$/', $config['slug'])) {
            $this->errors[] = "Invalid slug format. Use lowercase letters, numbers, and hyphens only.";
        }
    }

    /**
     * Validate version format
     */
    protected function validateVersion(array $config): void
    {
        if (isset($config['version']) && !preg_match('/^\d+\.\d+\.\d+$/', $config['version'])) {
            $this->errors[] = "Invalid version format. Use semantic versioning (e.g., 1.0.0).";
        }
    }

    /**
     * Validate React templates exist
     */
    protected function validateReactTemplates(array $config, string $themePath): void
    {
        if (!isset($config['templates']) || !is_array($config['templates'])) {
            $this->errors[] = "Templates configuration is missing or invalid.";
            return;
        }

        foreach ($config['templates'] as $name => $templateConfig) {
            $this->validateReactTemplate($name, $templateConfig, $themePath);
        }
    }

    /**
     * Validate React template
     */
    protected function validateReactTemplate(string $name, $templateConfig, string $themePath): void
    {
        if (is_array($templateConfig)) {
            if (!isset($templateConfig['component'])) {
                $this->errors[] = "React template '{$name}' missing component path.";
                return;
            }
            $componentPath = $templateConfig['component'];
        } elseif (is_string($templateConfig)) {
            $componentPath = $templateConfig;
        } else {
            $this->errors[] = "Invalid template configuration for '{$name}'.";
            return;
        }

        // Check if component file exists
        $fullPath = $themePath . '/' . $componentPath;
        if (!File::exists($fullPath)) {
            $this->errors[] = "React component not found: {$componentPath}";
        }
    }


    /**
     * Validate theme structure
     */
    public function validateStructure(string $themePath): bool
    {
        $this->errors = [];

        if (!File::exists($themePath)) {
            $this->errors[] = "Theme directory does not exist: {$themePath}";
            return false;
        }

        if (!File::exists($themePath . '/theme.json')) {
            $this->errors[] = "theme.json not found in theme directory.";
            return false;
        }

        // Validate theme.json is valid JSON
        try {
            $config = json_decode(File::get($themePath . '/theme.json'), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->errors[] = "theme.json contains invalid JSON: " . json_last_error_msg();
                return false;
            }
        } catch (\Exception $e) {
            $this->errors[] = "Failed to read theme.json: " . $e->getMessage();
            return false;
        }

        return empty($this->errors);
    }

    /**
     * Check for security issues in theme
     */
    public function validateSecurity(string $themePath): bool
    {
        $this->errors = [];

        // Check for suspicious files (PHP, executables)
        $suspiciousPatterns = ['*.php', '*.phar', '*.exe'];
        
        foreach ($suspiciousPatterns as $pattern) {
            $files = File::glob($themePath . '/**/' . $pattern);
            if (!empty($files)) {
                $this->errors[] = "Security warning: Suspicious files found with pattern: {$pattern}";
            }
        }

        return empty($this->errors);
    }
}
