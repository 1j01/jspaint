interface OSGUIWindow {
	/**
	 * Sets the title, or if `text` isn't passed, returns the current title of the window.
	 * 
	 * Uses jQuery getter/setter function idiom.
	 */
	title(text: string): OSGUI$Window;
	title(): string;
	// title(text?: string): OSGUI$Window | string; // union of overloads isn't helping

	/**
	 * Returns the current title of the window. Alternative to `title()`.
	 */
	getTitle(): string;

	/**
	 * Closes the window.
	 */
	close(force?: boolean): void;

	/**
	 * Tries to focus something within the window, in this order of priority:
	 * - The last focused control within the window
	 * - A control with `class="default"`
	 * - If it's a tool window, the parent window
	 * - and otherwise the window itself (specifically `$window.$content`)
	 */
	focus(): void;

	/**
	 * Removes focus from the window. If focus is outside the window, it is left unchanged.
	 */
	blur(): void;

	/**
	 * Minimizes the window. If `$window.task.$task` is defined it will use that as a target for minimizing, otherwise the window will minimize to the bottom of the screen.
	 */
	minimize(): void;

	/**
	 * Restores the window from minimized state.
	 */
	private unminimize(): void;

	/**
	 * Maximizes the window. While maximized, the window will use `position: fixed`, so it will not scroll with the page.
	 */
	maximize(): void;

	/**
	 * Restores the window from minimized or maximized state. If the window is not minimized or maximized, this method does nothing.
	 */
	restore(): void;

	/**
	 * Centers the window in the page.
	 * You should call this after the contents of the window is fully rendered, or you've set a fixed size for the window.
	 * If you have images in the window, wait for them to load before showing and centering the window, or define a fixed size for the images.
	 */
	center(): void;

	/**
	 * Fits the window within the page if it's partially offscreen.
	 * (Doesn't resize the window if it's too large; it'll go off the right and bottom of the screen.)
	 */
	applyBounds(): void;

	/**
	 * Repositions the window so that the title bar is within the bounds of the page, so it can be dragged.
	 */
	bringTitleBarInBounds(): void;

	/**
	 * Brings the window to the front by setting its `z-index` to larger than any `z-index` yet used by the windowing system.
	 */
	bringToFront(): void;

	/**
	 * Sets the size of the window. Pass `{ innerWidth, innerHeight }` to specify the size in terms of the window content, or `{ outerWidth, outerHeight }` to specify the size including the window frame.
	 * (This may be expanded in the future to allow setting the position as well...)
	 * (Also, the types could be loosened to allow mixing outer/inner for width/height, although that's a LITTLE bit questionable. Might have a use case, not sure.)
	 */
	setDimensions(dimensions: { innerWidth?: number; innerHeight?: number } | { outerWidth?: number; outerHeight?: number }): void;
	// setDimensions(dimensions: ({ innerWidth?: number } | { outerWidth?: number }) & ({ innerHeight?: number } | { outerHeight?: number })): void;

	/**
	 * Changes the icon(s) of the window. `icons` is in the same format as `options.icons`.
	 */
	setIcons(icons: OSGUIIcons): void;

	/**
	 * Sets the size of the window's title bar icon, picking the closest size that's available.
	 */
	setTitlebarIconSize(size: number): void;

	/**
	 * Returns the size of the window's title bar icon.
	 */
	getTitlebarIconSize(): number;

	/**
	 * Picks the closest icon size that's available, and returns a unique DOM node (i.e. cloned).
	 * This can be used for representing the window in the taskbar.
	 */
	getIconAtSize(size: number): Node | null;

	/**
	 * Appends the menu bar to the window, and sets the keyboard scope for the menu bar's hotkeys to the window.
	 * Can be called with `null` to remove the menu bar.
	 */
	setMenuBar(menuBar: MenuBar | null): void;

	/**
	 * The minimize target (taskbar button) represents the window when minimized, and is used for animating minimize and restore.
	 * If `minimizeTargetElement` is `null`, the window will minimize to the bottom of the screen (the default).
	 */
	setMinimizeTarget(minimizeTargetElement: HTMLElement | null): void;

	/**
	 * Creates a button in the window's content area.
	 * It automatically closes the window when clicked. There's no (good) way to prevent this, as it's intended only for dialogs.
	 * If you need any other behavior, just create a `<button>` and add it to the window's content area.
	 * Returns a jQuery object.
	 */
	$Button(text: string, action?: () => void): JQuery<HTMLButtonElement>;

	/**
	 * Defines a window as a child. For tool windows, the focus state will be shared with the parent window.
	 * 
	 * This is used internally when you set `options.parentWindow` when creating a window.
	 */
	private addChildWindow(childWindow: OSGUI$Window): void;

	/**
	 * Flying titlebar animation.
	 */
	private animateTitlebar(from: DOMRect, to: DOMRect, callback: () => void): void;

	/**
	 * Calls the listener when the window is (visually?) focused.
	 * Returns a function to remove the listener.
	 */
	private onFocus(listener: () => void): () => void;


	/**
	 * Calls the listener when the window (visually?) loses focus.
	 * Returns a function to remove the listener.
	 */
	private onBlur(listener: () => void): () => void;


	/**
	 * Calls the listener when the window is closed (after the close event is emitted, and if it wasn't prevented).
	 * Returns a function to remove the listener.
	 */
	private onClosed(listener: () => void): () => void;

	/**
	 * *jQuery object.*  
	 * Where you can append contents to the window.
	 */
	$content: JQuery<HTMLElement>;

	/**
	 * *jQuery object.*  
	 * The titlebar of the window, including the title, window buttons, and possibly an icon.
	 */
	$titlebar: JQuery<HTMLElement>;

	/**
	 * *jQuery object.*  
	 * Wrapper around the title. Don't use this. Use `$title` or `$titlebar` instead, if possible.
	 */
	private $title_area: JQuery<HTMLElement>;

	/**
	 * *jQuery object.*  
	 * The title portion of the titlebar.
	 */
	$title: JQuery<HTMLElement>;

	/**
	 * *jQuery object.*  
	 * The close button.
	 */
	$x: JQuery<HTMLButtonElement>;

	/**
	 * *jQuery object.*  
	 * The minimize button.
	 */
	$minimize: JQuery<HTMLButtonElement>;

	/**
	 * *jQuery object.*  
	 * The maximize button.
	 */
	$maximize: JQuery<HTMLButtonElement>;

	/**
	 * The DOM element that represents the window.
	 */
	element: HTMLElement;

	/**
	 * Whether the window has been closed.
	 */
	closed: boolean;

	/**
	 * Icons representing the window at different sizes.
	 */
	icons: OSGUIIcons;

	/**
	 * The titlebar icon.
	 */
	private $icon: JQuery<Node>;

	/**
	 * @deprecated The titlebar icon name/ID.
	 */
	private icon_name: string;

	/**
	 * @deprecated Returns the titlebar icon name/ID.
	 */
	getIconName(): string;

	/**
	 * @deprecated Sets the titlebar icon name/ID.
	 */
	setIconByID(id: string): void;

	/**
	 * @deprecated Taskbar item.
	 */
	task: {
		updateIcon(): void;
		updateTitle(): void;
	};

	private _minimize_slot_index: number;
}

/**
 * A jQuery object extended with OS-GUI.js window methods and properties.
 * 
 * This was a bad design decision.
 */
type OSGUI$Window = JQuery<HTMLElement & { $window: OSGUI$Window }> & OSGUIWindow;

/**
 * A window with a form, for some kinds of dialogs.
 */
interface OSGUIFormWindow extends OSGUIWindow {
	$form: JQuery<HTMLFormElement>;
	$main: JQuery<HTMLDivElement>;
	$buttons: JQuery<HTMLDivElement>;
	/** @override This version of $Button() prevents the form from submitting and the window from closing. */
	$Button(text: string, action: () => void): JQuery<HTMLButtonElement>;
}

/**
 * A jQuery object extended with OS-GUI.js form form window methods and properties.
 * 
 * This was a bad design decision.
 */
type OSGUI$FormWindow = JQuery<HTMLElement & { $window: OSGUI$FormWindow }> & OSGUIFormWindow;

/**
 * Creates a new window.
 */
interface $WindowConstructor {
	new(options?: OSGUIWindowOptions): OSGUI$Window;
	(options?: OSGUIWindowOptions): OSGUI$Window;

	DEBUG_FOCUS?: boolean;
	OVERRIDE_TRANSITION_DURATION?: number;
	Z_INDEX: number;
}

/**
 * Creates a new form window.
 */
function $FormWindow(title: string): OSGUI$FormWindow;

interface OSGUIWindowOptions {

	/** Sets the initial window caption. */
	title?: string;

	/** Specifies the icon of the window at different sizes. Pass an object with keys that are sizes in pixels (or "any"), and values that are the URL of an image, or an object with `srcset` if you want support different pixel densities, or a DOM node if you want full control (e.g. to use an `<svg>` or a font icon or an emoji). */
	icons?: OSGUIIcons;

	/** If `true`, the window will be a tool window, which means it will not have a minimize or maximize button, and it will be shown as always focused by default. It will also have a smaller close button in the default styles. */
	toolWindow?: boolean;

	/** If specified, the window will be a child of this window. For tool windows, the focus state will be shared with the parent window. */
	parentWindow?: OSGUI$Window;

	/** If set to `false`, the window will not have a maximize button. You cannot enable this if `toolWindow` is `true`. */
	maximizeButton?: boolean;

	/** If set to `false`, the window will not have a minimize button. You cannot enable this if `toolWindow` is `true`. */
	minimizeButton?: boolean;

	/** If set to `false`, the window will not have a close button. */
	closeButton?: boolean;

	/** If set to `true`, the window can be resized by the edges and corners. */
	resizable?: boolean;

	/** Specifies the initial width of the window, including borders. */
	outerWidth?: number;

	/** Specifies the initial height of the window, including title bar, menu bar, and borders. */
	outerHeight?: number;

	/** Specifies the initial width of the window contents, excluding borders. */
	innerWidth?: number;

	/** Specifies the initial height of the window contents, excluding title bar, menu bar, and borders */
	innerHeight?: number;

	/** The minimum outer width of the window (when resizing), in pixels. */
	minOuterWidth?: number;

	/** The minimum outer height of the window (when resizing), in pixels. */
	minOuterHeight?: number;

	/** The minimum width of the window contents (when resizing), in pixels. */
	minInnerWidth?: number;

	/** The minimum height of the window contents (when resizing), in pixels. */
	minInnerHeight?: number;

	/**
	 * A function that can be used to constrain the window to a particular rectangle.
	 * Takes and returns a rectangle object with `x`, `y`, `width`, and `height` properties.
	 * `x_axis` and `y_axis` define what is being dragged `-1` for left and top, `1` for right and bottom,
	 * and `0` for middle. Note that the window will always be constrained to not move past the minimum width and height.
	 */
	constrainRect?: (rect: { x: number; y: number; width: number; height: number }, x_axis: -1 | 0 | 1, y_axis: -1 | 0 | 1) => { x: number; y: number; width: number; height: number };

	/**
	 * Contains options for controlling iframe integration.
	 * 
	 * By default OS-GUI will try to enhance iframes with logic to:
	 * - Show the window as focused when the iframe has focus (this even works for nested iframes!)
	 * - Restore focus to controls in the iframe when refocusing the window (e.g. clicking the titlebar) (this even works for nested iframes!)
	 */
	iframes?: {

		/** Set to true to silence cross-origin warnings for iframes within the window. Focus integration can't fully work with cross-origin iframes. There will be cases where the window is not shown as focused when clicking into the iframe, and focus can't be restored to controls within the iframe. */
		ignoreCrossOrigin: boolean;

	};

	/** @deprecated */
	$component?: JQuery<HTMLElement> & { dock: () => void };
	/** @deprecated */
	icon?: string | { srcset: string } | Node;
}

/**
 * Specifies the icon of the window at different sizes.
 * 
 * Pass an object with keys that are sizes in pixels (or "any"),
 * and values that are either:
 * - the URL of an image,
 * - or an object with `srcset` if you want support different pixel densities,
 * - or a DOM node if you want full control (e.g. to use an `<svg>` or a font icon or an emoji).
 */
type OSGUIIcons = { [size: string]: OSGUIIcon };
type OSGUIIcon = string | { src: string } | { srcset: string } | Node;

const MENU_DIVIDER = "MENU_DIVIDER";

interface OSGUICheckbox {
	/** A function to check whether the checkbox is checked. */
	check: () => boolean;
	/** A function to toggle something application-specific. */
	toggle?: () => void;
	/** To create radio items, see the documentation on radio groups. Don't use this directly. */
	private type?: "checkbox" | "radio";
}

interface OSGUIMenuItem {
	/** A label for the item; ampersands define access keys (to use a literal ampersand, use `&&`) */
	label: string;
	/**
	 * A keyboard shortcut to show for the item, like "Ctrl+A"
	 * (Note: you need to listen for the shortcut yourself, unlike access keys)
	 */
	shortcutLabel?: string;
	/**
	 * `aria-keyshortcuts` for the item, like "Control+A Meta+A", for screen readers.
	 * "Ctrl" is not valid (you must spell it out), and it's best to provide an alternative for macOS,
	 * usually with the equivalent Command key, using "Meta" (and `event.metaKey`).
	 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts
	 */
	ariaKeyShortcuts?: string;
	/** A function to execute when the item is clicked (exclusive with `checkbox`) */
	action?: () => void;
	/** An object defining checkbox behavior for the item (exclusive with `action`) */
	checkbox?: OSGUICheckbox;
	/**
	 * Can be `false` to unconditionally disable the item, or a function
	 * that determines whether the item should be enabled, returning `true` to enable the item, `false` to disable.
	 */
	enabled?: boolean | (() => boolean);
	/** An array of menu item specifications to create a submenu */
	submenu?: OSGUIMenuFragment[];
	/** For implementing a status bar. An `info` event is emitted when rolling over the item with this description. */
	description?: string;

	/** @deprecated A label for the item. Use `label` instead. */
	item?: string;
	/** @deprecated */
	shortcut?: string;
}

interface OSGUIRadioItem extends OSGUIMenuItem {
	/** A value associated with the radio option; can be any type, but `===` is used to determine whether the item is checked. */
	value: any;
}

interface OSGUIRadioGroup {
	/** an array of menu item specifications to create a radio button group. Unlike `submenu`, the items are included directly in this menu. It is recommended to separate the radio group from other menu items with a `MENU_DIVIDER`. */
	radioItems: OSGUIRadioItem[];
	/** a function that should return the value of the selected radio item. */
	getValue: () => any;
	/** a function that should change the state to the given value, in an application-specific way. */
	setValue: (value: any) => void;
	/** a string to use as the `aria-label` for the radio group (for screen reader accessibility) */
	ariaLabel?: string;
}

interface MenuBar {
	/** The DOM element that represents the menu bar. */
	element: HTMLElement;
	/** Closes any menus that are open. */
	closeMenus(): void;
	/** Hotkeys like Alt will be handled at the level of the given element(s) or event target(s). */
	setKeyboardScope(...elements: EventTarget[]): void;
}

type OSGUIMenuFragment = OSGUIMenuItem | OSGUIRadioGroup | typeof MENU_DIVIDER;
// I wish I didn't make the top level special, but it's an object instead of an array.
type OSGUITopLevelMenus = Record<string, OSGUIMenuFragment[]>;

interface MenuBarConstructor {
	new(menus: OSGUITopLevelMenus): MenuBar;
	(menus: OSGUITopLevelMenus): MenuBar;
}

/** @deprecated use MenuBar instead of $MenuBar; jQuery is no longer required for menus. */
function $MenuBar(menus: OSGUITopLevelMenus): JQuery<HTMLElement>;

const AccessKeys: AccessKeys;
interface AccessKeys {
	/** Escapes ampersands in a label by doubling them. */
	escape(label: string): string;
	/** Unescapes ampersands in a label by removing one of each pair. */
	unescape(label: string): string;
	/** Returns whether the label has an access key. */
	has(label: string): boolean;
	/** Returns the access key character, or `null` if there isn't one. */
	get(label: string): string | null;
	/** Returns plain text without access key indicator, like toText() but with a special case to remove parentheticals such as " (&N)" rather than just the ampersand. */
	remove(label: string): string;
	/** Returns plain text without access key syntax. Leaves the access key letter even if it's a separate part of the label like "Foo (&1)" which becomes "Foo (1)". */
	toText(label: string): string;
	/** Returns HTML with `<span class="menu-hotkey">` around the access key (uses `AccessKeys.toFragment` for security). */
	toHTML(label: string): string;
	/** Returns a `DocumentFragment` with `<span class="menu-hotkey">` wrapping the access key character. */
	toFragment(label: string): DocumentFragment;
	/** Returns the index of the ampersand that defines an access key, or -1 if not present. */
	private indexOf(label: string): number;
}


// TODO: does CSSStyleDeclaration already satisfy the Record<string, string> type?
type CSSProps = Record<string, string> | CSSStyleDeclaration;

/**
 * Parses an INI file string into CSS properties.
 * 
 * Automatically renders dynamic theme graphics, and includes them in the CSS properties.
 */
function parseThemeFileString(themeString: string): Record<string, string>;

/**
 * Applies CSS properties to the DOM tree.
 * 
 * `cssProperties` is an object with CSS properties and values. It can also be a `CSSStyleDeclaration` object.
 * 
 * `element` is the element to apply the properties to.
 * 
 * If `recurseIntoIframes` is true, then the properties will be applied to all `<iframe>` elements within the element as well.
 * This only works with same-origin iframes.
 */
function applyCSSProperties(cssProperties: CSSProps, options?: { element?: HTMLElement, recurseIntoIframes?: boolean });

/**
 * Can be used to update theme graphics (scrollbar icons, etc.) for a specific section of the page. Used by the demo to show variations.
 * 
 * Returns CSS properties representing the rendered theme graphics.
 * 
 * @example
 * ```js
 * element.style.setProperty('--scrollbar-size', '30px');
 * applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), { element });
 * ```
 */
function renderThemeGraphics(cssProperties: CSSProps): Record<string, string>;

/**
 * Exports a CSS file for a theme. Assumes that the theme graphics are already rendered.
 * Includes a "generated file" comment.
 */
function makeThemeCSSFile(cssProperties: CSSProps): string;

/**
 * Initializes an SVG filter that can be used to make icons appear disabled.
 * It may not work with all icons, since it uses the black parts of the image to form a shape.
 * 
 * @example Usage from CSS:
 * ```css
 * button:disabled .icon {
 * 	filter: saturate(0%) opacity(50%); /* fallback until SVG filter is initialized *\/
 * 	filter: url("#os-gui-black-to-inset-filter");
 * }
 * ```
 */

function makeBlackToInsetFilter();


// ESM when? maybe next major version
const MenuBar: MenuBarConstructor;
const $Window: $WindowConstructor;
interface Window {
	$Window: $WindowConstructor;
	$FormWindow: typeof $FormWindow;
	MenuBar: MenuBarConstructor;
	$MenuBar: typeof $MenuBar;
	MENU_DIVIDER: typeof MENU_DIVIDER;
	AccessKeys: typeof AccessKeys;
	parseThemeFileString: typeof parseThemeFileString;
	applyCSSProperties: typeof applyCSSProperties;
	renderThemeGraphics: typeof renderThemeGraphics;
	makeThemeCSSFile: typeof makeThemeCSSFile;
	makeBlackToInsetFilter: typeof makeBlackToInsetFilter;
	// Provided by user (used by the library if present)
	get_direction?: () => "ltr" | "rtl";
	debugKeepMenusOpen?: boolean;
}