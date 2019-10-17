# backstack.js
Javascript/jQuery library to provide a usable mobile-like user-experience for web.
Create a viewport and tabs in HTML, then apply classes to buttons within your pages to traverse the backstack within the tab.

## Instructions
1. Apply optional backstack.css to `<head>` for mobile-like user interface styles - these instructions use them.
2. Apply jQuery library script
3. Apply backstack.js script after jQuery script
3. Create (optional) `<nav>` element
```
    <nav>
        <button class="bs-override-back"><</button>
    </nav>      
```
4. Create a viewport for the dynamic content in `<html>` tags. `class="container"` is of your choosing.
```
    <main id="main" class="container">
        <!-- dynamic content -->
    </main>
```
4. Create some tabs:
```
    <div>
        <button id="tab-one">
            <div>Tab 1</div>
        </button>
        <button id="tab-two">
            <div>Tab 2</div>
        </button>
        <button id="tab-three">
            <div>Tab 3</div>
        </button>
    </div>
```

5. Create a new `<script>` block to instantiate backstack.js. e.g:

    `<script>`
    ```javascript
        let onViewUpdated = function (tabViewId, url) {
            // onViewUpdated callback
        };
        let onError = function (tabViewId, url) {
            // onError callback
        };
        let viewportId = "main";
        let selectedTabViewId = "tab-one";
        let animationSpeed = 500;

        new TabBar([
            new Tab([
                new Screen("example1.html")                
            ], "tab-one"),
            new Tab([
                new Screen("example2-1.html"),
                new Screen("example2-2.html"),
                new Screen("example2-3.html")
            ], "tab-two"),
            new Tab([
                new Screen("example3.php")
            ], "tab-three")
        ], viewportId, selectedTabViewId, animationSpeed, onViewUpdated, onError);
    ```
    `</script>`