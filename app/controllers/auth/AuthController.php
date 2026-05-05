<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/path.php';
require_once __DIR__ . '/../../core/audit.php';
require_once __DIR__ . '/../../models/Auth.php';
require_once __DIR__ . '/../../core/sanitize.php';

/**
 * Handles authentication routes.
 */
class AuthController
{
	/**
	 * Validates the sign-in form and authenticates the user.
	 *
	 * @return array{email: string, error: ?string}
	 */
	public function signIn(): array
	{
		$signInError = null;
		$signInEmail = '';

		// If a user already has a session role, send them straight into the app.
		$currentUserRole = $_SESSION['user']['role'] ?? $_SESSION['user_role'] ?? null;

		if (is_string($currentUserRole) && $currentUserRole !== '') {
			$redirectPath = $currentUserRole === 'staff' ? '/products' : '/dashboard';
			header('Location: ' . routeUrl($redirectPath));
			exit;
		}

		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			// GET requests just render the form.
			return [
				'signInEmail' => $signInEmail,
				'signInError' => $signInError
			];
		}

		// Normalize the submitted form data before validation.
		$signInEmail = normalize_text(($_POST['email'] ?? ''));
		$signInPassword = (string) ($_POST['password'] ?? '');

		if ($signInEmail === '' || $signInPassword === '') {
			$signInError = 'Enter your email and password.';
			return [
				'signInEmail' => $signInEmail,
				'signInError' => $signInError
			];
		}

		if (!filter_var($signInEmail, FILTER_VALIDATE_EMAIL)) {
			$signInError = 'Enter a valid email address.';
			return [
				'signInEmail' => $signInEmail,
				'signInError' => $signInError
			];
		}

		try {
			// The auth model owns the lookup and password verification.
			$auth = new Auth(app_db());

			$user = $auth->attemptSignIn(mb_strtolower($signInEmail), $signInPassword);

			if ($user === null) {
				app_audit_log('auth_sign_in_failed', 'user', null, [
					'email' => mb_strtolower($signInEmail),
					'reason' => 'invalid_credentials',
				]);

				$signInError = 'Invalid email or password.';
				return [
					'signInEmail' => $signInEmail,
					'signInError' => $signInError
				];
			}

			// Regenerate the session ID after login to reduce fixation risk.
			session_regenerate_id(true);

			$_SESSION['user'] = [
				'user_id' => (int) $user['user_id'],
				'name' => (string) $user['name'],
				'email' => (string) $user['email'],
				'role' => (string) $user['role'],
			];
			$_SESSION['user_role'] = (string) $user['role'];

			app_audit_log('auth_sign_in', 'user', (int) $user['user_id'], [
				'email' => (string) $user['email'],
				'name' => (string) $user['name'],
				'role' => (string) $user['role'],
			]);

			// Route users to the correct landing page for their role.
			$redirectPath = $user['role'] === 'staff' ? '/products' : '/dashboard';
			header('Location: ' . routeUrl($redirectPath));
			exit;
		} catch (Throwable $throwable) {
			// Hide the underlying exception from the user to avoid leaking runtime details.
			app_audit_log('auth_sign_in_failed', 'user', null, [
				'email' => mb_strtolower($signInEmail),
				'reason' => 'system error',
			]);

			$signInError = 'Unable to sign in right now. Please try again.';
			return [
				'signInEmail' => $signInEmail,
				'signInError' => $signInError
			];
		}
	}

	/**
	 * Destroys the current user's session.
	 *
	 * @return void
	 */
	public function signOut(): void
	{
		if (session_status() === PHP_SESSION_NONE) {
			session_start();
		}

		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		$userEmail = (string) ($_SESSION['user']['email'] ?? '');
		$userName = (string) ($_SESSION['user']['name'] ?? '');

		app_audit_log('auth_sign_out', 'user', $userId > 0 ? $userId : null, [
			'email' => $userEmail,
			'name' => $userName,
		]);

		// Clear all session data to sign the user out.
		$_SESSION = [];
		session_destroy();

		if (ini_get('session.use_cookies')) {
			// Get current session cookie parameters to ensure the deletion cookie matches them.
			$params = session_get_cookie_params();
			// Set the session cookie to expire in the past, effectively deleting it from the browser.
			setcookie(
				session_name(),
				'',
				time() - 3600,
				$params['path'],
				$params['domain'],
				$params['secure'],
				$params['httponly']
			);
		}

		// Redirect to the sign-in page after signing out.
		header('Location: ' . routeUrl('/sign-in'));
		exit;
	}
}
