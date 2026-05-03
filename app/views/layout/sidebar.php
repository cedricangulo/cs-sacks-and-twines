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
          <h3 id="group-label-content-<?php echo $sectionIndex + 1; ?>">
            <?php echo $escape($section['label']); ?>
          </h3>

          <ul>
            <?php foreach ($section['links'] as $link): ?>
              <!-- Route URLs are resolved through the helper so subfolder installs keep working. -->
              <?php $linkHref = routeUrl($link['href']); ?>
              <li>
                <a
                  class="[&_svg]:opacity-70 hover:[&_svg]:opacity-100 dark:hover:text-foreground aria-[current=page]:text-primary aria-[current=page]:bg-primary/10 aria-[current=page]:dark:text-primary aria-[current=page]:dark:bg-primary/20"
                  href="<?php echo $escape($linkHref); ?>"
                  <?php echo $currentPath === $link['href'] ? ' aria-current="page"' : ''; ?>>
                  <?php $iconMarkup = app_icon_svg($link['icon']); ?>
                  <?php if ($iconMarkup !== ''): ?>
                    <span class="inline-flex items-center justify-center size-6 shrink-0" aria-hidden="true">
                      <?php echo $iconMarkup; ?>
                    </span>
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
        <li class="px-2">
          <button
            type="button"
            aria-label="Toggle theme mode"
            data-tooltip="Toggle theme mode"
            data-side="top"
            onclick="document.dispatchEvent(new CustomEvent('basecoat:theme'))"
            class="justify-start w-full px-3 btn-ghost hover:bg-sidebar-accent">
            <span class="hidden dark:block">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </span>
            <span class="block dark:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </span>
            <span>Theme</span>
          </button>
        </li>
        <li class="px-2 pb-2">
          <form action="<?php echo $escape(routeUrl('/sign-out')); ?>" method="post">
            <button class="justify-start w-full btn-ghost hover:text-destructive hover:bg-destructive/20" type="submit">
              <?php echo app_icon_svg('sign-out'); ?>
              <span>Sign Out</span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  </nav>
</aside>