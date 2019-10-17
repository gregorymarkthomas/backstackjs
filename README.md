# backstack.js
Javascript/jQuery library to provide a usable mobile-like user-experience for web.
Create a viewport and tabs in HTML, then apply classes to buttons within your pages to traverse the backstack within the tab.

[An example resides here on my website](https://gregorymarkthomas.com/dev/backstackjs "See example of backstack.js on Gregory's website")

## Requirements
* jQuery 3.4.1
  Newer versions should work.
* Javascript-enabled browser

## Instructions
1. Apply optional backstack.css to `<head>` for mobile-like user interface styles. These instructions will use them.

   `<link href="lib/backstackjs/css/backstack.css" rel="stylesheet" type="text/css" />`

2. Apply jQuery library script

   `<script src="lib/jquery/jquery-3.4.1.min.js" type="text/javascript"></script>`

3. Apply backstack.js script after jQuery script
   
   `<script src="lib/backstackjs/js/backstack.js" type="text/javascript"></script>`

4. Create (optional) `<nav>` element. 
   * `tabs-toolbar` forces this element to only use the space it needs. 
   * `container`'s properties' is of your choosing. 
   * `<button>` with class `"bs-override-back"` is a backstack.js-compatible back button

   ```
   <nav class="tabs-toolbar container">
      <button class="bs-override-back"><</button>
   </nav>      
   ```

5. Create a viewport for the dynamic content in `<html>` tags. 
   * `container`'s properties is of your choosing. 
   * `id="main"` will be used to instantiate the Backstack; backstack.js will inject the dynamic HTML into this element.
   
   ```
   <main id="main" class="tabs-viewport container">
      <!-- dynamic content -->
   </main>
   ```

6. Create some tabs. 
   * `class="tabs"` is used to force this element to only use the space it needs (i.e. it does not 'flow'). 
   * Each `<button>` has an id; these are specified when the Backstack is instantiated.

   ```
   <div class="tabs">
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

5. Create a new `<script>` block to instantiate backstack.js. Add your screens to each tab via the URLs. e.g:

    `<script>`
    ```javascript
        let onViewUpdated = function (tabViewId, url) {
            // onViewUpdated callback
        };
        let onError = function (tabViewId, url) {
            // onError callback
        };
        let viewportId = "main";
        let initiallySelectedTabViewId = "tab-one";
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
        ], viewportId, initiallySelectedTabViewId, animationSpeed, onViewUpdated, onError);
    ```
    `</script>`