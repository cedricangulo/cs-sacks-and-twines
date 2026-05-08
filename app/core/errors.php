<?php

declare(strict_types=1);

/**
 * Resolve the heading and copy for a given HTTP status code.
 *
 * @param int $statusCode
 * @return array{code:int,title:string,message:string}
 */
if (!function_exists('app_error_details')) {
  function app_error_details(int $statusCode): array
  {
    $details = [
      403 => [
        'title' => '403 - Forbidden',
        'message' => 'You do not have permission to access this page.',
      ],
      404 => [
        'title' => '404 - Not Found',
        'message' => "The page you're looking for doesn't exist.",
      ],
      405 => [
        'title' => '405 - Method Not Allowed',
        'message' => 'That request method is not allowed for this route.',
      ],
      500 => [
        'title' => '500 - Internal Server Error',
        'message' => 'Something went wrong while processing the request.',
      ],
      501 => [
        'title' => '501 - Not Implemented',
        'message' => 'This feature is not available yet.',
      ],
      502 => [
        'title' => '502 - Bad Gateway',
        'message' => 'The server received an invalid response from an upstream service.',
      ],
      503 => [
        'title' => '503 - Service Unavailable',
        'message' => 'The service is temporarily unavailable. Please try again shortly.',
      ],
      504 => [
        'title' => '504 - Gateway Timeout',
        'message' => 'The upstream service took too long to respond.',
      ],
      505 => [
        'title' => '505 - HTTP Version Not Supported',
        'message' => 'The server does not support the HTTP protocol version used by the request.',
      ],
    ];

    if (isset($details[$statusCode])) {
      return [
        'code' => $statusCode,
        'title' => $details[$statusCode]['title'],
        'message' => $details[$statusCode]['message'],
      ];
    }

    return [
      'code' => $statusCode,
      'title' => sprintf('%d - Error', $statusCode),
      'message' => 'An unexpected error occurred while loading this page.',
    ];
  }
}