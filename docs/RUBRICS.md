## 1. CRUD Functionality

When evaluating PHP web application projects, it's important to have clear criteria that cover the essential aspects of functionality, performance, and design. Below are detailed rubrics for three key areas: CRUD operations, asynchronous functionalities, and CSS library usage.
This rubric measures the core data operations and basic technical setup.

| Criteria                  | Excellent (5)                                                           | Good (4)                                     | Fair (3)                                | Poor (2)                              | Needs Improvement (1)          |
| :------------------------ | :---------------------------------------------------------------------- | :------------------------------------------- | :-------------------------------------- | :------------------------------------ | :----------------------------- |
| **Create Functionality**  | Data added correctly with validation and success message.               | Data added but lacks validation.             | Data added with minor issues.           | Create function works inconsistently. | Create function does not work. |
| **Read Functionality**    | Data displayed clearly in organized tables/lists with accurate records. | Data displayed with small formatting issues. | Data displayed but incomplete.          | Data display has errors.              | Cannot display records.        |
| **Update Functionality**  | Records can be edited smoothly and saved correctly.                     | Update works with minor issues.              | Update works but limited usability.     | Update often fails.                   | No update function.            |
| **Delete Functionality**  | Records deleted correctly with confirmation prompt.                     | Delete works with small issues.              | Delete works but no confirmation.       | Delete inconsistent.                  | No delete function.            |
| **Database Connection**   | Stable and secure connection using proper PHP/MySQL code.               | Connection works with minor errors.          | Connection works but poorly structured. | Frequent connection issues.           | No working connection.         |
| **User Interface Design** | Clean, organized, user-friendly layout.                                 | Good layout with minor issues.               | Acceptable design.                      | Confusing design.                     | Poor or unusable design.       |
| **Code Quality**          | Well-structured, readable, commented, reusable code.                    | Mostly clean code.                           | Average code structure.                 | Messy code.                           | Unorganized code.              |
| **Security Measures**     | Uses prepared statements, input sanitization, validation.               | Uses some security measures.                 | Minimal security.                       | Weak security.                        | No security practices.         |

**Scoring Guide for CRUD:**
* **36-40:** Outstanding
* **31-35:** Very Good
* **21-30:** Good
* **11-20:** Fair
* **1-10:** Needs Improvement

---

## 2. Asynchronous Functionalities
Asynchronous features allow tasks (like sending emails or processing reports) to run in the background without forcing the whole program to wait.

* **Benefits:** Improves speed, efficiency, and user experience. It reduces server response time and improves scalability for high-traffic sites.
* **Tools:** Common tools include AJAX, queues, and event-driven libraries.

### **Asynchronous Functionality Rubric** 

| Criteria                  | Excellent (5)                                                    | Good (4)                                | Fair (3)                         | Poor (2)                 | Needs Improvement (1)   |
| :------------------------ | :--------------------------------------------------------------- | :-------------------------------------- | :------------------------------- | :----------------------- | :---------------------- |
| **Implementation**        | Fully functional async processes with smooth execution.          | Mostly functional with minor issues.    | Functional but limited features. | Inconsistent execution.  | No async functionality. |
| **AJAX / Background Use** | Effectively uses AJAX, queues, or async tools correctly.         | Good use with small errors.             | Basic implementation only.       | Weak or incorrect use.   | No use of async tools.  |
| **System Responsiveness** | Fast response time while tasks run in background.                | Responsive with slight delays.          | Acceptable responsiveness.       | Slow performance.        | Unresponsive system.    |
| **Error Handling**        | Proper handling of failed requests, retries, and user feedback.  | Minor missing error checks.             | Basic error handling only.       | Poor handling of errors. | No error handling.      |
| **Code Quality**          | Clean, organized, readable, and maintainable code.               | Mostly organized code.                  | Average structure.               | Messy code.              | Poorly written code.    |
| **Task Integration**      | Async tasks integrate correctly with database or processes.      | Minor integration issues.               | Basic integration.               | Frequent errors.         | No integration.         |
| **User Experience**       | Clear loading indicators, notifications, and smooth interaction. | Good user experience with small issues. | Acceptable interface.            | Confusing experience.    | Poor user interaction.  |
| **Security Measures**     | Proper validation, sanitization, secure requests.                | Good security with minor gaps.          | Basic security only.             | Weak security.           | No security measures.   |

**Scoring Guide for Async:** Identical to the CRUD scoring ranges.

---

## 3. CSS Libraries
CSS libraries help developers create attractive, responsive interfaces faster. Since PHP focuses on server-side logic, these libraries handle front-end design without requiring code from scratch.

* **Examples:** Bootstrap or Tailwind CSS.
* **Features:** Ready-made layouts, buttons, forms, and responsive grids.

### **CSS Libraries Rubric** 

| Criteria                  | Excellent (5)                                              | Good (4)                             | Fair (3)                    | Poor (2) / Needs Imp. (1)                 |
| :------------------------ | :--------------------------------------------------------- | :----------------------------------- | :-------------------------- | :---------------------------------------- |
| **Library Integration**   | Fully integrated and works correctly in all pages.         | Mostly integrated with minor issues. | Basic integration only.     | Partial integration (2) / No library (1). |
| **User Interface Design** | Layout is highly attractive, professional, and consistent. | Good design with small issues.       | Acceptable design.          | Weak design (2) / Poor design (1).        |
| **Responsiveness**        | Fully responsive on desktop, tablet, and mobile.           | Responsive with minor issues.        | Works on most devices.      | Not responsive (2) / Limited (1).         |
| **Use of Components**     | Excellent use of buttons, forms, cards, tables, etc.       | Good use of components.              | Basic components used.      | No useful components (2) / Limited (1).   |
| **Customization**         | Styles are well customized to match project theme.         | Good customization with minor gaps.  | Some customization applied. | No customization (2) / Minimal (1).       |
| **Code Organization**     | Clean, readable, and properly linked CSS/PHP files.        | Mostly organized.                    | Acceptable structure.       | Messy code (2) / Poor organization (1).   |
| **Functionality Support** | Design supports PHP features smoothly (forms, dashboards). | Minor support issues.                | Basic support only.         | Weak integration (2) / No support (1).    |
| **Overall Presentation**  | Professional, polished, and user-friendly output.          | Good overall presentation.           | Average presentation.       | Weak presentation (2) / Unfinished (1).   |

**Scoring Guide for CSS:** Identical to the CRUD scoring ranges.

---

# Security Implementation Checklist: Sacks & Twines App

### 1. Config
[ ] **`php.ini` Hardening:** Set `display_errors = Off` and `expose_php = Off` to hide your PHP version and prevent raw database errors from being shown to users.
[ ] **Server-Level Upload Limits:** Restrict `upload_max_filesize` and `post_max_size` in `php.ini` to limit the size of uploaded sack/twine reference images.
[ ] **`.htaccess` Directory Protection:** Add `Options -Indexes` to your root folder to disable directory listing.
[ ] **`.htaccess` File Protection:** Use `<FilesMatch>` to enforce `Require all denied` on sensitive files like your `.json` audit logs, `.htpasswd`, or database configurations.
[ ] **Disable PHP in Uploads:** Place an `.htaccess` file inside your image uploads folder with `php_flag engine off` to prevent execution of malicious scripts.

### 2. Validation (Client and Server Side)
[ ] **Client-Side Validation:** Use HTML5 attributes (e.g., `type="number"`, `min`, `max`, `required`) and front-end JavaScript to validate that inputs like "Quantity", "SRP Price", and "Low Stock Threshold" are formatted correctly before submission.
[ ] **Server-Side Validation:** Never trust user input. Check the data again in PHP using functions like `strlen()` or `preg_match()` to ensure data types are correct and to prevent buffer overflow attacks.
[ ] **Code-Level Extension Validation:** Explicitly validate uploaded image files on the server using `in_array()` against an allowed list (e.g., `jpg`, `png`).

### 3. Sanitization (Client and Server Side)
[ ] **Client-Side Sanitization:** Utilize JavaScript to filter out dangerous characters from text fields (like "Item Name" or "Supplier") before the form is sent to the server.
[ ] **Server-Side Sanitization:** Clean all incoming data in PHP to strip out HTML tags (e.g., `<script>`) to prevent Cross-Site Scripting (XSS) attacks before saving it to your database.

### 4. Hash (Updated from Pre-Lesson 6)
[ ] **Avoid Vulnerable Algorithms:** Never use fast hashing algorithms like MD5 or SHA1 for passwords, as they are easily cracked using pre-computed rainbow tables (like CrackStation).
[ ] **Modern Password Hashing:** Use PHP's native `password_hash()` function with `PASSWORD_DEFAULT` (which currently uses the strong bcrypt algorithm) to convert plain-text passwords into irreversible gibberish.
[ ] **Automatic Cryptographic Salting:** Rely on `password_hash()` to automatically generate and apply a random "salt" to your hashes. This eliminates the possibility of attackers looking up the hash in a pre-calculated rainbow table.
[ ] **Optimized Database Storage:** Ensure your `password_hash` column in the database is set to `VARCHAR(255)`. Even though bcrypt currently generates a 60-character string, `PASSWORD_DEFAULT` is designed to change and expand over time as stronger algorithms (like Argon2) are added to PHP.
[ ] **Secure Login Verification:** Use the `password_verify()` function during the login process to securely check if the user's entered plain-text password matches the salted hash stored in the database.

### 5. Session Management
[ ] **Session Hijacking Defenses:** Enforce secure session cookies by setting `session.cookie_httponly = 1`, `session.cookie_secure = 1`, and `session.use_only_cookies = 1` in your `php.ini` or session initiation code.
[ ] **Role-Based Access Control (RBAC):** Use session variables to strictly enforce user roles. Cashiers should only have permission to view products and process "Stock Out" transactions, while only Admins can access "Stock In", user management, and product editing.

### 6. Additional Security Features (Optional / Score Boosters)
[ ] **Prepared Statements (CRUD Security):** Defeat SQL Injection completely by using `mysqli_prepare()`, `mysqli_stmt_bind_param()`, and `mysqli_stmt_execute()` for all database transactions (Stock In, Stock Out, Add Product).
[ ] **JSON Audit Logs:** Track all FIFO inventory rotations (Stock In/Out) by saving the action, user, and timestamp into a local `.json` file that is protected by `.htaccess`.
[ ] **Frontend Snooping Deterrents:** Write a JavaScript event listener to disable the right-click context menu (`contextmenu`) and specific keyboard shortcuts (like F12 or Ctrl+Shift+I) to deter casual code snooping.