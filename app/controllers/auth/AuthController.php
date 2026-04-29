<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/path.php';
require_once __DIR__ . '/../../models/Auth.php';

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
			$redirectPath = $currentUserRole === 'cashier' ? '/products' : '/dashboard';
			header('Location: ' . routeUrl($redirectPath));
			exit;
		}

		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			// GET requests just render the form.
			return ['signInEmail' => $signInEmail, 'signInError' => $signInError];
		}

		// Normalize the submitted form data before validation.
		$signInEmail = trim((string) ($_POST['email'] ?? ''));
		$signInPassword = (string) ($_POST['password'] ?? '');

		if ($signInEmail === '' || $signInPassword === '') {
			$signInError = 'Enter your email and password.';
			return ['signInEmail' => $signInEmail, 'signInError' => $signInError];
		}

		if (!filter_var($signInEmail, FILTER_VALIDATE_EMAIL)) {
			$signInError = 'Enter a valid email address.';
			return ['signInEmail' => $signInEmail, 'signInError' => $signInError];
		}

		try {
			// The auth model owns the lookup and password verification.
			$auth = new Auth(app_db());
			$user = $auth->attemptSignIn(mb_strtolower($signInEmail), $signInPassword);

			if ($user === null) {
				$signInError = 'Invalid email or password.';
				return ['signInEmail' => $signInEmail, 'signInError' => $signInError];
			}

			// Regenerate the session ID after login to reduce fixation risk.
			session_regenerate_id(true);

			$_SESSION['user'] = [
				'id' => (int) $user['id'],
				'name' => (string) $user['name'],
				'email' => (string) $user['email'],
				'role' => (string) $user['role'],
			];
			$_SESSION['user_role'] = (string) $user['role'];

			// Route users to the correct landing page for their role.
			$redirectPath = $user['role'] === 'cashier' ? '/products' : '/dashboard';
			header('Location: ' . routeUrl($redirectPath));
			exit;
		} catch (Throwable $throwable) {
			// Hide the underlying exception from the user to avoid leaking runtime details.
			$signInError = 'Unable to sign in right now. Please try again.';
			return ['signInEmail' => $signInEmail, 'signInError' => $signInError];
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

		// Clear all session data to sign the user out.
		$_SESSION = [];
		session_destroy();

		if (ini_get('session.use_cookies')) {
			$params = session_get_cookie_params();
			setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
		}

		// Redirect to the sign-in page after signing out.
		header('Location: ' . routeUrl('/sign-in'));
		exit;
	}
}
