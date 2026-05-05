<?php

declare(strict_types=1);

/**
 * Sanitizes a value for safe use as plain text output.
 * 
 * This function performs the following steps:
 * 1. Converts the input to a string.
 * 2. Trims leading and trailing whitespace.
 * 3. Removes control characters (ASCII 0-31 and 127).
 * 4. Optionally strips HTML tags.
 * 5. Collapses multiple whitespace characters into a single space.
 * @param mixed $value The value to sanitize.
 * @param bool $stripTags Whether to remove HTML tags from the input. Default is true
 * @return string The sanitized string safe for plain text output.
 */
function sanitize_plain_text(mixed $value, bool $stripTags = true): string
{
  $s = (string) $value;
  // Strip whitespace (or other characters) from the beginning and end of a string
  $s = trim($s);
  // Perform a regular expression search and replace
  $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s) ?: '';
  if ($stripTags) {
    $s = strip_tags($s);  // Strip HTML and PHP tags from a string
  }
  // Perform a regular expression search and replace
  $s = preg_replace('/\s+/u', ' ', $s) ?: '';
  return $s;
}

/**
 * Escapes a string for safe output in HTML contexts.
 * This function converts special characters to their corresponding HTML entities, preventing them from being interpreted as HTML or JavaScript code.
 * @param string $value The string to escape for HTML output.
 * @return string The escaped string safe for HTML output.
 */
function escape_for_html(string $value): string
{
  return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Normalize input text by trimming and collapsing whitespace.
 * Kept as a helper to match previous controller behaviour.
 */
function normalize_text(mixed $value): string
{
  $text = trim((string) $value);
  $text = preg_replace('/\s+/u', ' ', $text) ?: '';
  return $text;
}

/**
 * Normalize password-like input by trimming only.
 */
function normalize_password(mixed $value): string
{
  return trim((string) $value);
}

/**
 * Wrapper to remove control characters from passwords (preserve punctuation).
 */
function sanitize_password(string $value): string
{
  // Remove control characters (ASCII 0-31 and 127) but keep punctuation and whitespace
  // Example: "P@ssw0rd\n" becomes "P@ssw0rd"
  $cleaned = preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?: '';
  return $cleaned;
}

/**
 * Normalize a submitted decimal value.
 *
 * @param string $value
 * @return string
 */
function normalize_decimal(string $value): string
{
  $normalized = trim((string) $value);

  return is_numeric($normalized) ? $normalized : '';
}

// Backwards-compatible aliases for any code using camelCase names (optional).
function sanitizePlainText(string $value): string
{
  return sanitize_plain_text($value, true);
}
function sanitizePassword(string $value): string
{
  return sanitize_password($value);
}
function normalizeText(string $value): string
{
  return normalize_text($value);
}
function normalizePassword(string $value): string
{
  return normalize_password($value);
}
function normalizeDecimal(string $value): string
{
  return normalize_decimal($value);
}