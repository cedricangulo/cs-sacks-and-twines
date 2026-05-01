<?php

declare(strict_types=1);

/**
 * Upload a product image file to the uploads directory.
 *
 * @param array $file The $_FILES array entry for the image input
 * @return string|null The saved filename on success, or null on failure
 */
function app_upload_product_image(array $file): ?string
{
	if (!isset($file['error']) || is_array($file['error'])) {
		return null;
	}

	if ($file['error'] !== UPLOAD_ERR_OK) {
		return null;
	}

	$maxFileSize = 5 * 1024 * 1024;

	if ($file['size'] > $maxFileSize) {
		return null;
	}

	$allowedMimeTypes = [
		'image/jpeg' => 'jpg',
		'image/png' => 'png',
	];

	$finfo = new finfo(FILEINFO_MIME_TYPE);
	$mimeType = $finfo->file($file['tmp_name']) ?? '';

	if (!isset($allowedMimeTypes[$mimeType])) {
		return null;
	}

	$originalName = $file['name'] ?? '';
	$originalExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
	$allowedExtensions = ['jpg', 'jpeg', 'png'];

	if (!in_array($originalExtension, $allowedExtensions, true)) {
		return null;
	}

	$extension = $allowedMimeTypes[$mimeType];

	$imageInfo = getimagesize($file['tmp_name']);
	if ($imageInfo === false) {
		return null;
	}

	$uniqueName = sprintf('%s-%s.%s', date('YmdHis'), bin2hex(random_bytes(4)), $extension);

	$uploadDir = __DIR__ . '/../../public/uploads/products';

	if (!is_dir($uploadDir)) {
		mkdir($uploadDir, 0755, true);
	}

	$destination = $uploadDir . '/' . $uniqueName;

	if (!move_uploaded_file($file['tmp_name'], $destination)) {
		return null;
	}

	return $uniqueName;
}