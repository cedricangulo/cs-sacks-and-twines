<?php
// Sidebar navigation is derived from the active role so the menu stays in sync
// with route permissions.
$userRole = app_current_user_role();
$currentPath = request_path();
$visibleSections = app_navigation_for_role($userRole);

// Escape output once and reuse the helper for all menu labels and paths.
$escape = static fn($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
?>

<aside class="sidebar" data-side="left" aria-hidden="false">
  <nav aria-label="Sidebar navigation">
    <section class="scrollbar">
      <?php foreach ($visibleSections as $sectionIndex => $section): ?>
        <div role="group" aria-labelledby="group-label-content-<?php echo $sectionIndex + 1; ?>">
          <h3 id="group-label-content-<?php echo $sectionIndex + 1; ?>"><?php echo $escape($section['label']); ?></h3>

          <ul>
            <?php foreach ($section['links'] as $link): ?>
              <!-- Route URLs are resolved through the helper so subfolder installs keep working. -->
              <?php $linkHref = routeUrl($link['href']); ?>
              <li>
                <a href="<?php echo $escape($linkHref); ?>" <?php echo $currentPath === $link['href'] ? ' aria-current="page"' : ''; ?>>
                  <?php $iconMarkup = app_icon_svg($link['icon']); ?>
                  <?php if ($iconMarkup !== ''): ?>
                    <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true"><?php echo $iconMarkup; ?></span>
                  <?php endif; ?>
                  <span><?php echo $escape($link['label']); ?></span>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </div>
      <?php endforeach; ?>
    </section>
    <div role="group" aria-label="Session actions">
      <ul>
        <li>
          <form action="<?php echo $escape(routeUrl('/sign-out')); ?>" method="post">
            <button class="btn-ghost w-full" type="submit">
              <?php echo app_icon_svg('sign-out'); ?>
              <span>Sign Out</span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  </nav>
</aside>