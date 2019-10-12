/**
    backstack.js:

    Contains these classes:
    - Screen
    - Backstack
    - Tab
    - TabBar
*/

/**
 * Screen:
 * Represents a screen of the app - it does not know anything about itself. It is not loaded until requested.
 * 
 * Note:
 * - Be careful of using 'html' as a variable name - it can conflict with existing vars.
 */
class Screen {

    /**
    * constructor:
    * @param {string} url - URL of the page this screen holds the HTML to.    
    *
    * @var {string} htmlCode - holds the HTML of the page this Screen represents.
    * @var {boolean} forceRefreshOnLoad - is TRUE if we do not want to use the cached HTML. This is used when a form has been submitted on this Screen.
    * @var {string} goTerm - the search term used to set onClick listeners on buttons that push a Screen onto the backstack.
    * @var {string} goBackTerm - the search term used to set onClick listeners on buttons that pop a Screen from the backstack.
    * @var {string} goAndClearTerm - the search term used to set onClick listeners on buttons that push a Screen onto the backstack but also pop the current one.
    * @var {string} submitTerm - the search term used to set onClick listeners on form submission buttons. We stop tradition form submissions and instead rely on AJAX.
    * @var {string} refreshTerm - the search term used to set onClick listeners on 'refresh' buttons. We force the Screen to refresh on press of these buttons.
    */
    constructor(url) {
        this.url = url;
        this.htmlCode = null;
        this.forceRefreshOnLoad = false;
        this.goTerm = ".bs-override-go";
        this.backTerm = ".bs-override-back";
        this.goAndClearTerm = ".bs-override-clear";
        this.submitTerm = ".bs-override-submit";
        this.refreshTerm = ".bs-override-refresh";
    }

    /**
     * initialiseIgnoreCache():
     * Returns the HTML of the page this Screen represents by doing an AJAX GET.
     * This is done using a callback due to the asynchronous nature of GET-ing the HTML for the URL.
     * We also set the Screen onClick listeners here - whoever initialises the screen is told when Go, Back and Go+Clear buttons are pressed.
     *
     * We never get a cached version of the HTML - we do a .get every time.
     * This is to get around the issue where scripts are reloaded.
     *
     * @param {boolean} isBackVisible - true if all Back buttons are visible (i.e. if there is a Screen to go back to).
     * @param {function} onGetHTML - notifies caller when HTML has been generated for this Screen.
     * @param {function} onGo - notifies caller when user has pressed a button to move forward a Screen.
     * @param {function} onBack - notifies caller when user has pressed a button to move back a Screen.
     * @param {function} onGoAndClear - notifies caller when user has pressed a button to move forward a Screen but disallow ability to go back to previous Screen.
     * @param {function} onSubmit - notifies caller when user has pressed Submit on a form.
     * @param {function} onRefresh - notifies caller when user has pressed a button to refresh the page.
     */
    initialiseIgnoreCache(isBackVisible, onGetHTML, onGo, onBack, onGoAndClear, onSubmit, onRefresh) {
        var self = this;
        $.get(this.url, function (htmlCode) {
            this.forceRefreshOnLoad = false;
            self.htmlCode = htmlCode;                
            onGetHTML(htmlCode, self.url);
            self.setupOverrides(isBackVisible, onGo, onBack, onGoAndClear, onSubmit, onRefresh);
        });
    }

    /**
     * initialise():
     * Returns the HTML of the page this Screen represents by doing an AJAX GET.
     * This is done using a callback due to the asynchronous nature of GET-ing the HTML for the URL.
     * We also set the Screen onClick listeners here - whoever initialises the screen is told when Go, Back and Go+Clear buttons are pressed.
     *
     * On first visit of this Screen we of course GET the HTML. On other visits we used the cached version.
     * If a form has been submitted on the Screen, then forceRefreshOnLoad is set to TRUE, so the page would be forced to GET HTML again.
     * This is so the Screen shows the most recent data.
     *
     * @param {boolean} isBackVisible - true if all Back buttons are visible (i.e. if there is a Screen to go back to).
     * @param {function} onGetHTML - notifies caller when HTML has been generated for this Screen.
     * @param {function} onGo - notifies caller when user has pressed a button to move forward a Screen.
     * @param {function} onBack - notifies caller when user has pressed a button to move back a Screen.
     * @param {function} onGoAndClear - notifies caller when user has pressed a button to move forward a Screen but disallow ability to go back to previous Screen.
     * @param {function} onSubmit - notifies caller when user has pressed Submit on a form.
     * @param {function} onRefresh - notifies caller when user has pressed a button to refresh the page.
     */
    initialise(isBackVisible, onGetHTML, onGo, onBack, onGoAndClear, onSubmit, onRefresh) {
        var self = this;
        if (this.htmlCode == null || this.forceRefreshOnLoad) {
            $.get(this.url, function (htmlCode) {
                this.forceRefreshOnLoad = false;
                self.htmlCode = htmlCode;
                onGetHTML(htmlCode, self.url);
                self.setupOverrides(isBackVisible, onGo, onBack, onGoAndClear, onSubmit, onRefresh);
            });
        } else {
            onGetHTML(this.htmlCode, this.url);
            this.setupOverrides(isBackVisible, onGo, onBack, onGoAndClear, onSubmit, onRefresh);
        }
    }

    /**
     * setupOverrides():
     * Sets up overrides that stop links from continuing in the traditional way.
     * We hijack links and submits. When they are pressed, we callback to the caller to notify it.
     * We reapply this for every Screen that is being used.
     * 
     * @param {boolean} isBackVisible - true if all Back buttons are visible (i.e. if there is a Screen to go back to).
     * @param {function} onGo - notifies caller when user has pressed a button to move forward a Screen.
     * @param {function} onBack - notifies caller when user has pressed a button to move back a Screen.
     * @param {function} onGoAndClear - notifies caller when user has pressed a button to move forward a Screen but disallow ability to go back to previous Screen.
     * @param {function} onSubmit - notifies caller when user has pressed Submit on a form.
     * @param {function} onRefresh - notifies caller when user has pressed a button to refresh the page.
     */
    setupOverrides(isBackVisible, onGo, onBack, onGoAndClear, onSubmit, onRefresh) {
        var self = this;
        self.setBackVisibilityOverride(isBackVisible); 
        self.setGoOverride(onGo);
        self.setBackOverride(onBack);
        self.setGoAndClearOverride(onGoAndClear);
        self.setSubmitOverride(onSubmit);
        self.setRefreshOverride(onRefresh);                       
    }

    /**
     * setGoOverride():
     * Adds an onClick listener to all buttons that move the user forward (i.e adds a screen onto the top of the backstack).
     * We want to pass back the destination URL so it can be used to create a new Screen object.
     * The Screen destroys itself before any changes are made to the backstack.
     * 
     * @param {function} callback - notifies caller button has been pressed.
     */
    setGoOverride(callback) {
        var self = this;
        $(this.goTerm).click(function () {
            console.log("setGoOverride(): onClick");
            self.destroy();
            callback(this.href);
            return false;
        });
    }

    /**
     * setBackOverride():
     * Adds an onClick listener to all buttons that move the user backwards (i.e removes a screen from the top of the backstack).
     * The Screen destroys itself before any changes are made to the backstack.
     * 
     * @param {function} callback - notifies caller button has been pressed.
     */
    setBackOverride(callback) {
        var self = this;
        $(this.backTerm).click(function () {
            self.destroy();
            callback();
            return false;
        });
    } 

    /**
     * setGoAndClearOverride():
     * Adds an onClick listener to all buttons that move the user 'sideways' (i.e removes screen from top of backstack AND THEN adds a screen onto the backstack).
     * We want to pass back the destination URL so it can be used to create a new Screen object.
     * The Screen destroys itself before any changes are made to the backstack.
     * 
     * @param {function} callback - notifies caller button has been pressed.
     */
    setGoAndClearOverride(callback) {
        var self = this;
        $(this.goAndClearTerm).click(function () {
            self.destroy();
            callback(this.href);
            return false;
        });
    }

    /**
     * setSubmitOverride():
     * Adds an onClick listener to all form submission buttons.
     * 
     * We want to stop the traditional form process of reloading the whole screen on submit - this is why we 'return false'.
     * 
     * On a form submission, data has probably changed. This override just tells the Screen to do a hard refresh when it is next loaded (instead of from cache).
     * 
     * We still callback to Tab to notify it that a submission has occurred.
     * We DO NOT destroy().
     * 
     * serializeArray() will serialise both GET and POST data into an array.
     * 
     * @param {function} callback - notifies caller button has been pressed.
    */
    setSubmitOverride(callback) {
        var self = this;
        $(this.submitTerm).submit(function (e) {
            self.forceRefreshOnLoad = true;
            callback(e.target.action, e.target.method, $(self.submitTerm).serializeArray(), function(data) {
                console.error("setSubmitOverride(): onFailure: " + data.status + " " + data.statusText);
            });
            return false;
        });
    }

    /**
     * setRefreshOverride():
     * Adds an onClick listener to all buttons with this term.
     * This will force the Screen to refresh itself.
     * This may be used on Profile screens where user decidesto DISCARD changes - we want to refresh view to revert old data.
     * 
     * 'forceRefreshOnLoad' just tells the Screen to do a hard refresh when it is next loaded (instead of from cache).
     * 
     * @param {function} callback - notifies caller button has been pressed.
    */
    setRefreshOverride(callback) {
        var self = this;
        $(this.refreshTerm).click(function () {
            console.log("setRefreshOverride(): onClick");
            self.forceRefreshOnLoad = true;
            self.destroy();
            callback();
            return false;
        });
    }

    /**
     * setBackVisibility():
     * Show all Back buttons on the Screen if isVisible.
     * Hide all Back buttons on the Screen if not isVisible.
     * 
     * @param {function} callback - notifies caller button has been pressed.
    */
    setBackVisibilityOverride(isVisible) {
        if (isVisible) {
            $(this.backTerm).css('visibility', 'visible');
        } else {
            $(this.backTerm).css('visibility', 'hidden');
        }
    }

    /**
     * clearGoOverride():
     * Removes onClick listener.
     */
    clearGoOverride() {
        $(this.goTerm).off("click");
    }

    /**
     * clearBackOverride():
     * Removes onClick listener.
     */
    clearBackOverride() {
        $(this.backTerm).off("click");
    }

    /**
     * clearGoAndClearOverride():
     * Removes onClick listener.
     */
    clearGoAndClearOverride() {
        $(this.goAndClearTerm).off("click");
    }

    /**
    * clearSubmitOverride():
    * Removes onClick listener.
    */
    clearSubmitOverride() {
        $(this.submitTerm).off("submit");
    }

    /**
    * clearRefreshOverride():
    * Removes onClick listener.
    */
    clearRefreshOverride() {
        $(this.refreshTerm).off("click");
    }

    /**
     * destroy():
     * Clears all jQuery event listeners for this Screen.
     * This is to ensure double-clicks and stale listeners do not hang around and cause issues.
     */
    destroy() {
        this.clearGoOverride();
        this.clearBackOverride();
        this.clearGoAndClearOverride();
        this.clearSubmitOverride();
        this.clearRefreshOverride();
    }
}


/**
 * Backstack:
 * Holds an array of Screens, and provides management of screens.
 * Each Tab has a Backstack.
 * */
class Backstack {

    /**
     * constructor:
     * @param {Screen[]} initialScreens - array of Screens to fill the Backstack with on initialisation
     */
    constructor(initialScreens) {
        this.screens = initialScreens;
    }

    /**
     * pop():
     * Removes a Screen from the top of the stack.
     * This will always leave a screen left in the stack, and should be used the majority of the time.
     * Returns true if there is a Screen to pop from the backstack.
     */
    pop() {
        var success = false;
        if (this.screens.length > 1) {
            success = (this.screens.pop() ? true : false);
        }
        return success;
    }

    /**
     * popForced():
     * Removes a Screen from the top of the stack.
     * This version will pop and is able to remove the one and only screen (unlike pop()).
     * This should be used with care.
     * 
     * Returns true if there is a Screen to pop from the backstack.
     */
    popForced() {
        var success = false;
        if (this.screens.length >= 1) {
            success = (this.screens.pop() ? true : false);
        }
        return success;
    }

    /**
    * push():
    * Adds a Screen from the top of the stack.
    * 
    * Returns true if the Screen is successfully pushed to the top of the backstack.
    */
    push(screen) {
        return (this.screens.push(screen) ? true : false);
    }

    /**
     * getCurrent():
     * Gets the current Screen (the Screen that is top of the stack)
     */
    getCurrent() {
        return this.screens[this.screens.length - 1]
    }
}


/**
 * Tab:
 * Represents the clickable outer Tab.
 **/
class Tab {

    /**
     * constructor:
     * 
     * @param {Screen[]} initialScreens - array of Screen objects that this Tab will initially handle. This will mostly be just 1 Screen.
     * @param {string} tabViewId - ID of the view this object represents.
     */
    constructor(initialScreens, tabViewId) {
        this.backstack = new Backstack(initialScreens);
        this.viewId = tabViewId;
    }

    /**
     * onClick():
     * Sets OnClick listener for when user presses this Tab.
     * 
     * @param {function} preCreate - notifies caller that Screen is about to be created.
     * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
     */
    onClick(preCreate, onGetHTML) {
        var self = this;
        $("#" + this.viewId).click(function () {
            preCreate();
            self.getHtml(onGetHTML);
        })
    }

    /**
     * getHtml():
     * Get the HTML from the current Screen and show in the view container.
     * Register callbacks from any backstack-related button clicks that occur on the current Screen.
     * 
     * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
     */
    getHtml(onGetHTML) {
        var self = this;        
        this.backstack.getCurrent().initialise(this.isHeaderBackVisible(), onGetHTML, function (url) {
            self.onGo(url, onGetHTML);
        }, function () {
            self.onBack(onGetHTML);
        }, function (url) {
            self.onGoAndClear(url, onGetHTML);
        }, function (action, method, data, onFailure) {
            self.onSubmit(action, method, data, onGetHTML, onFailure);
        }, function () {
            self.onRefresh(onGetHTML);
        });
    }

    submitForm(action, method, data, onSuccess, onError) {
        $.ajax({
            url: action,
            data: data,
            processData: false,
            contentType: false,
            type: method.toUpperCase(),
            success: function(data) {
                onSuccess();
            },
            error: function(data) {
                onError(data);
            }
        });
    }

    /**
     * onGo():
     * The user is going to another (forward) page - we need to push the new page onto the backstack.
     * 
     * @param {string} url - URL of the page to GO to.
     * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
     */
    onGo(url, onGetHTML) {
        if (this.backstack.push(new Screen(url))) {
            this.getHtml(onGetHTML);
        } else {
            console.error("onGo(): could not push screen with url '" + url + "' to the backstack.");
        }
    }

    /**
     * onBack():
     * The user is going back to a previous page - we need to pop the current page from the backstack.
     * Only refresh the view if there was a Screen to pop (i.e. wasn't the only Screen left in backstack).
     * 
     * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
     */
    onBack(onGetHTML) {
        if (this.backstack.pop()) {
            this.getHtml(onGetHTML);
        } else {
            /** Screen is the only one left in the backstack **/
            console.log("onBack(): did not pop Screen from backstack, though this could be because it's the last in stack. backstack length = " + this.backstack.screens.length);
        }
    }

    /**
    * onGoAndClear():
    * The user is going 'sideways' to another page (i.e. they want to go to another page and they don't want an opportunity to come back).
    * We need to pop the current page from the backstack and push the new page onto the backstack.
    * backstack.popForced() is used only here so that if a Go + Clear button is used when there is only 1 screen, we want to pop the last screen.
    * Normal pop() will always leave one screen left, but popForced() can leave zero screens left.
    * 
    * @param {string} url - URL of the page to GO to.
    * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
    */
    onGoAndClear(url, onGetHTML) {
        this.backstack.popForced();
        this.backstack.push(new Screen(url));
        this.getHtml(onGetHTML);
    }

    /**
    * onSubmit():
    *
    * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
    */
    onSubmit(action, method, data, onSuccess, onError) {
        this.submitForm(action, method, data, onSuccess, onError);
    }

    /**
    * onRefresh():
    * We want to refresh the current Screen so newly saved data or previous data prior to saving is now shown.
    *
    * @param {function} onGetHTML - notifies caller that Screen has generated the HTML.
    */
    onRefresh(onGetHTML) {
        this.getHtml(onGetHTML);
    }

    /**
     * destroy():
     * Destroys the current screen. 
     * This is only used when the user clicks a new Tab - we want to clear the Tab before changing to the new one.
     * If user traverses between Screens within one Tab, each Screen will destroy itself, so this function is not used for that.
     **/
    destroy() {
        this.backstack.getCurrent().destroy();
    }

    /**
     * isBackVisible():
     * Defines if ANY back button should be visible/enabled.
     * Returns true if there is a Screen for the user to go back to.
     * An example of its use is for _AppHeader where we make the back button invisible if there is nothing to go back to.
     * */
    isHeaderBackVisible() {
        return this.backstack.screens.length > 1;
    }
}

/**
 * TabBar:
 * Represents the selection of Tabs.
 * This manages global tabs operations:
 *  - removing tabSelectedClass from a tab if another tab is selected.
 *  - triggering onDestroy on the current Tab before the new Tab is shown.
 **/
class TabBar {

    /**
     * constructor:
     * 
     * @param {Tab[]} tabs - array of Tab objects.
     * @param {string} appViewId - view ID of container that will show the Screen HTML.
     * @param {string} selectedTabViewId - ID of the tab view that is selected first.
     * @param {string} transitionSpeed - speed that jQuery animation will operate at when Screens are changed.
     * @param {function} onViewUpdated - callback that is called when new HTML has been applied to view container.
     */
    constructor(tabs, appViewId, selectedTabViewId, transitionSpeed, onViewUpdated) {
        this.tabClassName = "btn-tab";
        this.tabSelectedClassName = "btn-tab-selected";

        this.tabs = tabs;
        this.selectedTabViewId = selectedTabViewId;
        this.transitionSpeed = transitionSpeed;

        this.setTabsClickListeners(appViewId, onViewUpdated);
        this.clickTab(selectedTabViewId);
    }

    /**
     * setTabsClickListeners():
     * Tells the individual Tabs to set their OnClick listeners. They do their own thing.     * 
     * TabBarView visually highlights the currently chosen tab.
     * When a new Tab is clicked on, TabBarView notifies the current Tab to destroy its destroyables like listeners etc.
     *  - This is to stop any conflicts of objects between the views.
     *  
     * @param {string} appViewId - view ID of container that will show the Screen HTML.
     * @param {function} onViewUpdated - callback that is called when new HTML has been applied to view container.
     */
    setTabsClickListeners(appViewId, onViewUpdated) {
        var self = this;
        this.tabs.forEach(function (tab) {
            $("#" + tab.viewId).click(function () {
                self.removeSelectedViewClass("." + "btn-tab");
                self.addSelectedViewClass("#" + tab.viewId)
            });

            tab.onClick(function () {
                self.animateOut(appViewId, self.transitionSpeed, function () {
                    self.findTab(self.selectedTabViewId).destroy();
                    self.selectedTabViewId = tab.viewId;     
                });                        
            }, function (htmlCode, url) {                
                $(appViewId).html(htmlCode);
                onViewUpdated(tab.viewId, url);
                self.animateIn(appViewId, self.transitionSpeed);                
            });
        });
    }

    findTab(tabViewId) {
        let selectedTab = this.tabs.find(function (tab) {
            return tab.viewId == tabViewId
        });

        if (selectedTab != null)
            return selectedTab;
        else
            console.error("backstack.js findTab(): could not find tab with id '" + tabViewId + "'");
    }

    /**
     * clickTab():
     * Triggers a click on the specified tab.
     */
    clickTab(tabViewId) {
        $("#" + tabViewId).click();
    }

    /**
    * addSelectedViewClass():
    * Adds a new class to this Tab's view to change its visible state to 'selected'.
    * 
    * @param {any} view - the selected view's ID or class.
    */
    addSelectedViewClass(view) {
        $(view).addClass(this.tabSelectedClassName);
    }

    /**
     * removeSelectedViewClass():
     * Removes the 'selected' visible state class from this Tab's view to make it 'unselected'.
     * 
     * @param {any} view
     */
    removeSelectedViewClass(view) {
        $(view).removeClass(this.tabSelectedClassName);
    }

    /**
     * animateIn(): (WIP)
     * I hoped to use fadeIn/animate here but the animation is stopped mid-way through.
     * I had to settle for what is there below.
     * @param {string} viewId
     * @param {string/int} transitionSpeed
     */
    animateIn(viewId, transitionSpeed) {
        console.log("animateIn(): starting");
        $(viewId).css("visibility", "visible");
    }

    /**
     * animateOut(): (WIP)
     * I hoped to use fadeIn/animate here but the animation is stopped mid-way through.
     * I had to settle for what is there below.
     * @param {string} viewId
     * @param {string/int} transitionSpeed
     * @param {function} onComplete
     */
    animateOut(viewId, transitionSpeed, onComplete) {
        console.log("animateOut(): starting");
        $(viewId).css("visibility", "hidden");
        onComplete();
    }
}