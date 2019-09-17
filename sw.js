/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "favicon.ico",
    "revision": "41da0d7d1ac65f715955a8ffe0bc4a0f"
  },
  {
    "url": "help/cloud-mask.png",
    "revision": "c940bfe6c0ea7ba413683d0927aba2d6"
  },
  {
    "url": "help/clouds.jpg",
    "revision": "dbfc5169220b9ea36f912ca1d72394e4"
  },
  {
    "url": "help/coUA.css",
    "revision": "5893f43b84552f579df2ed9ed6a20eb9"
  },
  {
    "url": "help/default.html",
    "revision": "ac345554a35ec8ab73ca50bf2e09e05b"
  },
  {
    "url": "help/flag&clouds.gif",
    "revision": "8e6d79af1edd2cc4f4e1473a4fc422d0"
  },
  {
    "url": "help/memcopy.html",
    "revision": "a30dc1a98bdc4b3e126caff4dfa963c7"
  },
  {
    "url": "help/mspaint.hhc",
    "revision": "e67d1fee11746bc9b54b60858ddf1b3f"
  },
  {
    "url": "help/mspaint.hhk",
    "revision": "a9d77dc9efdc37bace7d7890ce7ef734"
  },
  {
    "url": "help/nobgcolor.css",
    "revision": "c053072c8e5d4db6963d179e2f77b42f"
  },
  {
    "url": "help/onestep.gif",
    "revision": "f02be7bff6a476c3fb3d97a51be832c9"
  },
  {
    "url": "help/p_airb.gif",
    "revision": "92a1fbc84455668abb00df074309d4bf"
  },
  {
    "url": "help/p_brush.gif",
    "revision": "73bb66ea2548d3d1229bb87da6d79e46"
  },
  {
    "url": "help/p_curve.gif",
    "revision": "47609bf261bad798b461e3c5b5fd8b70"
  },
  {
    "url": "help/p_erase.gif",
    "revision": "606c7c91b114888eb52e7f55141dbbad"
  },
  {
    "url": "help/p_eye.gif",
    "revision": "c811681492e148ba08474127579054f0"
  },
  {
    "url": "help/p_free.gif",
    "revision": "ab095441d497f099c5a05fe7893d56b4"
  },
  {
    "url": "help/p_line.gif",
    "revision": "089742675638df9c980bb483f8dc7dc4"
  },
  {
    "url": "help/p_opaq.gif",
    "revision": "033c07fa8db2b1d5ecdb63f8a6e99701"
  },
  {
    "url": "help/p_oval.gif",
    "revision": "17d0903ff30e58cf33e181d9cefa2f77"
  },
  {
    "url": "help/p_paint.gif",
    "revision": "4e2adbdf36919469d954d074733feb1d"
  },
  {
    "url": "help/p_pencil.gif",
    "revision": "335f67e5d60e25cf515cbe890e198d7a"
  },
  {
    "url": "help/p_poly.gif",
    "revision": "83b3bae7dad86ad91ce5bc397d33ebf5"
  },
  {
    "url": "help/p_rect.gif",
    "revision": "4e6089842ed5b98568501a2571062813"
  },
  {
    "url": "help/p_rrect.gif",
    "revision": "c93bb126f7e95ee501fdf79467310de2"
  },
  {
    "url": "help/p_sel.gif",
    "revision": "7371f1de670107f2f27a8800f3210d03"
  },
  {
    "url": "help/p_trans.gif",
    "revision": "07fdc7a136d5b46fc44dcae0c15c0dc9"
  },
  {
    "url": "help/p_txt.gif",
    "revision": "2e8e0d2e622b2718fe8ced7b22853c2f"
  },
  {
    "url": "help/paint_airbrush.html",
    "revision": "b7f410d0ffd37a14e5243b6b814e6928"
  },
  {
    "url": "help/paint_blackwhite.html",
    "revision": "a43b4af39547d89bacf1b4537d155a75"
  },
  {
    "url": "help/paint_brush.html",
    "revision": "4f24322057d14e7655f598fe0ca76f66"
  },
  {
    "url": "help/paint_change_color.html",
    "revision": "4a245829c7303601ddb0b3eba332c3d9"
  },
  {
    "url": "help/paint_change_size.html",
    "revision": "3a7c8e96374e02212fc4a7bf5260ba58"
  },
  {
    "url": "help/paint_clear_image.html",
    "revision": "9e77afcb0eee1bf246fddbae5dfe0b7b"
  },
  {
    "url": "help/paint_color_box.html",
    "revision": "2e28c3a947a2e3541f8540c55015712a"
  },
  {
    "url": "help/paint_curves.html",
    "revision": "580287c735e4c18d088ed99a05f1c073"
  },
  {
    "url": "help/paint_custom_colors.html",
    "revision": "02dd38466d373d63dd74de2e017b0de5"
  },
  {
    "url": "help/paint_cutout_copy_move.html",
    "revision": "ecbc5f1f279c25d79152b81ee3430351"
  },
  {
    "url": "help/paint_cutout_save.html",
    "revision": "595803f5695c3b685d652a2b602ada96"
  },
  {
    "url": "help/paint_cutout_select.html",
    "revision": "4489b462349c7ef4dc80eaf69ec091f0"
  },
  {
    "url": "help/paint_enlarge_area.html",
    "revision": "4b02ae5c2e69ce3be2c66d5793899b40"
  },
  {
    "url": "help/paint_erase_large.html",
    "revision": "c3ad7d5eda0be26f34ed2f15f0c88234"
  },
  {
    "url": "help/paint_erase_small.html",
    "revision": "38ed1af00e18adb65c118de8e4983392"
  },
  {
    "url": "help/paint_fill.html",
    "revision": "3a291587ce6418f2b0bfa27433fa0486"
  },
  {
    "url": "help/paint_flip_picture.html",
    "revision": "04836e168d00a89f28780cdfc21fd6c0"
  },
  {
    "url": "help/paint_freeform_lines.html",
    "revision": "e36827abb41760e7e301e7cfb200b22e"
  },
  {
    "url": "help/paint_grid.html",
    "revision": "1a66b6a942cf8d131a74fb9d0d5ab2d5"
  },
  {
    "url": "help/paint_insert_file.html",
    "revision": "4897c2a3ff6182351cfd79ff731938e1"
  },
  {
    "url": "help/paint_invert.html",
    "revision": "6e7841b83958c1a6bd02a808d25bf466"
  },
  {
    "url": "help/paint_lines.html",
    "revision": "6c5be5ced2db5d8e277801eae206227b"
  },
  {
    "url": "help/paint_not_in_color_box.html",
    "revision": "3a0b7e23df5164f893bb0f84398ca5c5"
  },
  {
    "url": "help/paint_ovals.html",
    "revision": "35f3ec3cd350b5869361738231707896"
  },
  {
    "url": "help/paint_polygons.html",
    "revision": "1aba4c52ec595ecebf665cd43b077685"
  },
  {
    "url": "help/paint_print.html",
    "revision": "e96a01a2b87351a1b64470e5a22a0dba"
  },
  {
    "url": "help/paint_rectangles.html",
    "revision": "52e32caa306e04933735dbf9ddc64b29"
  },
  {
    "url": "help/paint_set_default_colors.html",
    "revision": "2bfcdb915fe4789d492b04d0f6ddef59"
  },
  {
    "url": "help/paint_skew_picture.html",
    "revision": "e6e4f98deb3daca4e89bac8c552562c4"
  },
  {
    "url": "help/paint_text.html",
    "revision": "c9eac4acaa58872faa901c40d51ba391"
  },
  {
    "url": "help/paint_toolbox.html",
    "revision": "7f8bf9ad892703dc57efd66481037402"
  },
  {
    "url": "help/paint_trans_opaque.html",
    "revision": "973dbd8e38a0744655080f08ee0bf98c"
  },
  {
    "url": "help/paint_undo.html",
    "revision": "536424a3577ecd33ac1759d2a175d3d3"
  },
  {
    "url": "help/paint_wallpaper.html",
    "revision": "c0d067b47f71616292dc11904061ea6d"
  },
  {
    "url": "help/paint_zoom.html",
    "revision": "989e8c2186589d01b71b079b1b22fc27"
  },
  {
    "url": "help/vaporwave.js",
    "revision": "79912e3c11ff8a37b0793217ab22a708"
  },
  {
    "url": "images/98.js.org.svg",
    "revision": "fcb179df8b8f7fc6eef56e1780075716"
  },
  {
    "url": "images/arrows.png",
    "revision": "ddc6440981424885bb932f4c24f8b4ed"
  },
  {
    "url": "images/cursors/airbrush.png",
    "revision": "40d12cd219d9aba89e70e93c507be3ff"
  },
  {
    "url": "images/cursors/default.png",
    "revision": "caec2cabbfd1205d88cbeb85d3ba9e67"
  },
  {
    "url": "images/cursors/ew-resize.png",
    "revision": "1fe49fd87f29f28132fc18a2b5ec265e"
  },
  {
    "url": "images/cursors/eye-dropper.png",
    "revision": "a969aca27557451d0f239ca460c4a8c8"
  },
  {
    "url": "images/cursors/fill-bucket.png",
    "revision": "0723f543801c0b13f0e3c4433db247d2"
  },
  {
    "url": "images/cursors/magnifier.png",
    "revision": "5167678d9d24834c4a55b7849656a2e7"
  },
  {
    "url": "images/cursors/move.png",
    "revision": "7a5c67912a1f6f3132e076571af4ca28"
  },
  {
    "url": "images/cursors/nesw-resize.png",
    "revision": "333e66b8ae51c7d06cafeb63f89f9dc1"
  },
  {
    "url": "images/cursors/ns-resize.png",
    "revision": "b57b960c63007fa85d9a1dacde1dfe0d"
  },
  {
    "url": "images/cursors/nwse-resize.png",
    "revision": "1f436f3da7a915456a3eb04212827b2f"
  },
  {
    "url": "images/cursors/pencil.png",
    "revision": "0753abcf4b3b1eb576515a7ef83d17f0"
  },
  {
    "url": "images/cursors/precise-dotted.png",
    "revision": "a1599b063d8a3dd905e4f72ad45e057e"
  },
  {
    "url": "images/cursors/precise.png",
    "revision": "694153a0e0c9452fd2dfdf2e3b51758b"
  },
  {
    "url": "images/cursors/precise2.png",
    "revision": "c2f7ac78a047eb2dc2cd625e41735c29"
  },
  {
    "url": "images/help-icons.png",
    "revision": "b7bbdf218ec8cea4b18a9c2dfa07591c"
  },
  {
    "url": "images/icons/128x128.png",
    "revision": "ab4fd1a9957b7ca8c5db3a5b0052a031"
  },
  {
    "url": "images/icons/16x16.png",
    "revision": "8dc522d480697d00a2566e316244bc92"
  },
  {
    "url": "images/icons/32x32.png",
    "revision": "ba71b0f7fac1767c2571a00ac183d917"
  },
  {
    "url": "images/icons/48x48.png",
    "revision": "5c694f244e4e7504cbdb50cd779a504b"
  },
  {
    "url": "images/icons/512x512.png",
    "revision": "027f92c183c06f98c0e75e8a78ce4798"
  },
  {
    "url": "images/icons/96x96.png",
    "revision": "769a8daf02c643ae423a807651b453d9"
  },
  {
    "url": "images/icons/android-icon-144x144.png",
    "revision": "fce7689c2cdb155f942eabaa29617484"
  },
  {
    "url": "images/icons/android-icon-192x192.png",
    "revision": "689692646eb8e0d0e0de8e7413b6877d"
  },
  {
    "url": "images/icons/android-icon-36x36.png",
    "revision": "44a9dc92d6fa2db6f0de34519610c38c"
  },
  {
    "url": "images/icons/android-icon-48x48.png",
    "revision": "5c694f244e4e7504cbdb50cd779a504b"
  },
  {
    "url": "images/icons/android-icon-72x72.png",
    "revision": "976a650d0bf24553405c173b56ae4806"
  },
  {
    "url": "images/icons/android-icon-96x96.png",
    "revision": "769a8daf02c643ae423a807651b453d9"
  },
  {
    "url": "images/icons/apple-icon-114x114.png",
    "revision": "10d7e275ea9412ee85455d5bcdb1db79"
  },
  {
    "url": "images/icons/apple-icon-120x120.png",
    "revision": "bdf8e605fa0dd490027424ff133e50f1"
  },
  {
    "url": "images/icons/apple-icon-144x144.png",
    "revision": "fce7689c2cdb155f942eabaa29617484"
  },
  {
    "url": "images/icons/apple-icon-152x152.png",
    "revision": "5ee64f12817bea35cf9c9c329d4b82c4"
  },
  {
    "url": "images/icons/apple-icon-180x180.png",
    "revision": "4e76c473fa39051de0bb2daa88e28b39"
  },
  {
    "url": "images/icons/apple-icon-57x57.png",
    "revision": "37d5b7345a62593fbc071726b057fb5c"
  },
  {
    "url": "images/icons/apple-icon-60x60.png",
    "revision": "87b07c690c7dd331880c1d6c865beaed"
  },
  {
    "url": "images/icons/apple-icon-72x72.png",
    "revision": "976a650d0bf24553405c173b56ae4806"
  },
  {
    "url": "images/icons/apple-icon-76x76.png",
    "revision": "62f927623bb57b8d79003ad21738e5d0"
  },
  {
    "url": "images/icons/apple-icon-precomposed.png",
    "revision": "72f49ad139b933215f7fbf9fd853503a"
  },
  {
    "url": "images/icons/apple-icon.png",
    "revision": "72f49ad139b933215f7fbf9fd853503a"
  },
  {
    "url": "images/icons/jspaint.svg",
    "revision": "757b6fcb7b82be03ddcfb59a7e0cf975"
  },
  {
    "url": "images/icons/mac.icns",
    "revision": "60a1e86684d75033a6c740b3c2115c2d"
  },
  {
    "url": "images/icons/ms-icon-144x144.png",
    "revision": "fce7689c2cdb155f942eabaa29617484"
  },
  {
    "url": "images/icons/ms-icon-150x150.png",
    "revision": "f2c9d9517df802e135b6614fc169adb4"
  },
  {
    "url": "images/icons/ms-icon-310x310.png",
    "revision": "095df8ece95eaf9d046f502df0ba222e"
  },
  {
    "url": "images/icons/ms-icon-70x70.png",
    "revision": "b97bae46c184dfaa4db69f341f53383a"
  },
  {
    "url": "images/icons/safari-pinned-tab-source.svg",
    "revision": "2a88caef1413e9228cf3045a21d72656"
  },
  {
    "url": "images/icons/safari-pinned-tab.svg",
    "revision": "d99b8290c80f4051026d2b3c30323955"
  },
  {
    "url": "images/icons/silhouette-48x48.svg",
    "revision": "886d3f719a0250eb0a7b146396e3e24b"
  },
  {
    "url": "images/icons/windows.ico",
    "revision": "4e21da63ff5c08cb92045fa24d4420aa"
  },
  {
    "url": "images/meta/facebook-card.png",
    "revision": "b9874ba0251ae62924d9b060fc1d94c7"
  },
  {
    "url": "images/meta/main-screenshot.png",
    "revision": "3ec3cfd04f41a14f4a0c724425211855"
  },
  {
    "url": "images/meta/mobipaint.png",
    "revision": "a44bf64b45e77472462d8ced83976886"
  },
  {
    "url": "images/meta/twitter-card.png",
    "revision": "aa7edbe588e44818d86138a37aa0f091"
  },
  {
    "url": "images/modern/cursors/airbrush-alt.cur",
    "revision": "98cb0ee7fbc61478f03a25af36e1b575"
  },
  {
    "url": "images/modern/cursors/airbrush.cur",
    "revision": "98cb0ee7fbc61478f03a25af36e1b575"
  },
  {
    "url": "images/modern/cursors/crosshair-large.cur",
    "revision": "945dd40360fdffdac51e5a1362d83881"
  },
  {
    "url": "images/modern/cursors/crosshair.cur",
    "revision": "ec0ab6a9d15d5baadbd075f899d512ab"
  },
  {
    "url": "images/modern/cursors/ew-resize-large.cur",
    "revision": "a0a5235859e978646c496ec341bdb970"
  },
  {
    "url": "images/modern/cursors/ew-resize.cur",
    "revision": "5073bbcd9d5a3d2302bbf3fdd59cc040"
  },
  {
    "url": "images/modern/cursors/eye-dropper-large.cur",
    "revision": "08264d2028602528c0c799c0d4f0d905"
  },
  {
    "url": "images/modern/cursors/eye-dropper.cur",
    "revision": "6d374405fd033f2622d775b944cf4fb2"
  },
  {
    "url": "images/modern/cursors/magnifier-large.cur",
    "revision": "a0e107da7163489a0fa175b047eebbf6"
  },
  {
    "url": "images/modern/cursors/magnifier.cur",
    "revision": "ee224896ef78816cc304ad65cc026e2c"
  },
  {
    "url": "images/modern/cursors/move-large-alt.cur",
    "revision": "962e90ab223f5ea5d8f2aee17885aa0d"
  },
  {
    "url": "images/modern/cursors/move-large.cur",
    "revision": "962e90ab223f5ea5d8f2aee17885aa0d"
  },
  {
    "url": "images/modern/cursors/move.cur",
    "revision": "411d25265a5004c111821f2a2ad0a9d5"
  },
  {
    "url": "images/modern/cursors/nesw-resize-large.cur",
    "revision": "755331cfa373adc34bce56434a1cd38b"
  },
  {
    "url": "images/modern/cursors/nesw-resize.cur",
    "revision": "fd930ad80b3a0e3492c3ae77c11719c9"
  },
  {
    "url": "images/modern/cursors/ns-resize-large.cur",
    "revision": "00681bef313ac95bacae1d654e2d6efd"
  },
  {
    "url": "images/modern/cursors/ns-resize.cur",
    "revision": "d3883fb2a1c3ff02e13b4fa446df22d3"
  },
  {
    "url": "images/modern/cursors/nwse-resize-large.cur",
    "revision": "8088a2d89d9924bb3771d3aa81f76e25"
  },
  {
    "url": "images/modern/cursors/nwse-resize.cur",
    "revision": "bc18e36986e379ab0f87e7d940c5e922"
  },
  {
    "url": "images/modern/cursors/paint-bucket-large.cur",
    "revision": "02c9ed0fe2caeb817416359a3bd00b77"
  },
  {
    "url": "images/modern/cursors/paint-bucket.cur",
    "revision": "26d4bef82e8dc53458fc219150ec0222"
  },
  {
    "url": "images/modern/cursors/pencil-large.cur",
    "revision": "fcfeea664b00ed610159f3017b4a8dc3"
  },
  {
    "url": "images/modern/cursors/pencil.cur",
    "revision": "65075a7dc27352105a344e01c303e712"
  },
  {
    "url": "images/modern/cursors/precise-large.cur",
    "revision": "4c3e07d8a18e004516db81deb6edb7fa"
  },
  {
    "url": "images/modern/cursors/precise.cur",
    "revision": "1d121e1d1a91b7e3dbf6e694b26baa8a"
  },
  {
    "url": "images/modern/cursors/select-alt.cur",
    "revision": "a53a18ef5d84ba997cf55abaad88f818"
  },
  {
    "url": "images/modern/cursors/select-large-alt.cur",
    "revision": "5a95dadbba8fb49410a171bae8d38fb9"
  },
  {
    "url": "images/modern/cursors/select-large.cur",
    "revision": "5a95dadbba8fb49410a171bae8d38fb9"
  },
  {
    "url": "images/modern/cursors/select.cur",
    "revision": "a53a18ef5d84ba997cf55abaad88f818"
  },
  {
    "url": "images/modern/cursors/text-large.cur",
    "revision": "3d5b1e905d80bcf4e753155e1ea91c08"
  },
  {
    "url": "images/modern/cursors/text.cur",
    "revision": "5e8ffb338372410c2025ae282d3dbed5"
  },
  {
    "url": "images/modern/cursors/zoom-in-large.cur",
    "revision": "e13dfecd83ab243cb0798347a46b7dac"
  },
  {
    "url": "images/modern/cursors/zoom-in.cur",
    "revision": "e40e7b4c8d21e0f7e4f99697929b14cc"
  },
  {
    "url": "images/modern/cursors/zoom-out-large.cur",
    "revision": "8feb8883e651471444c27d2a78894637"
  },
  {
    "url": "images/modern/cursors/zoom-out.cur",
    "revision": "b9ed29883c8407642e7d8127da94b2db"
  },
  {
    "url": "images/modern/options-transparency.png",
    "revision": "4f0407cbb4119bd1b6ca856fb59ce9af"
  },
  {
    "url": "images/modern/tools-and-stuff.png",
    "revision": "a5182c761e0b376b8fdc67fb9b59a549"
  },
  {
    "url": "images/modern/tools.png",
    "revision": "d3a9c577e2a1a21b155872f6ccb49d39"
  },
  {
    "url": "images/options-airbrush-size.png",
    "revision": "550e985c3ff5d4f80da944595475f520"
  },
  {
    "url": "images/options-magnification.png",
    "revision": "058aae19f20674d2969c75847c2d9213"
  },
  {
    "url": "images/options-transparency.png",
    "revision": "b14b9d8487f98e523ed9f903feac65cf"
  },
  {
    "url": "images/text-tools.png",
    "revision": "b01e35fa9bfe5b4b526a09ec1a2a1f3c"
  },
  {
    "url": "images/toolbar-icons.png",
    "revision": "e58fe0bca269c727e1ae87c366a47d78"
  },
  {
    "url": "images/tools-and-stuff.png",
    "revision": "2eb4fe50a6de26db22cc0951055cd1a9"
  },
  {
    "url": "images/transforms/skew-x.png",
    "revision": "3579a82c61d2f624d3e689e0fb0a336e"
  },
  {
    "url": "images/transforms/skew-y.png",
    "revision": "83b6821b8a993e8de35220a3852e348f"
  },
  {
    "url": "images/transforms/stretch-x.png",
    "revision": "ac30e2df0971904e853d9b86e91536cf"
  },
  {
    "url": "images/transforms/stretch-y.png",
    "revision": "747ed0adbf15ed0103fb90dfe9956f30"
  },
  {
    "url": "index.html",
    "revision": "cf312effde4fe29b5e1e56061405d957"
  },
  {
    "url": "lib/canvas.toBlob.js",
    "revision": "f9efe20f507dec380f42afd464b21845"
  },
  {
    "url": "lib/FileSaver.js",
    "revision": "45c0a77698a49b716c9bd8b24c671ae9"
  },
  {
    "url": "lib/firebase.js",
    "revision": "5ccfb14e0bcd36764ad6389a35f63fd4"
  },
  {
    "url": "lib/font-detective.js",
    "revision": "a739e17cc19db7f32c48464b5ef44548"
  },
  {
    "url": "lib/gif.js/gif.js",
    "revision": "326345913f0fd457bc5a5a47572e62c0"
  },
  {
    "url": "lib/gif.js/gif.worker.js",
    "revision": "69838c104d724d5e20a578e5301ee818"
  },
  {
    "url": "lib/jquery-3.4.1.min.js",
    "revision": "220afd743d9e9643852e31a135a9f3ae"
  },
  {
    "url": "lib/konami.js",
    "revision": "b533736ba12671c53fcac48f6df6e094"
  },
  {
    "url": "lib/libtess.min.js",
    "revision": "1a8b9f2fb64ae42486db31bdfc96ea8a"
  },
  {
    "url": "lib/palette.js",
    "revision": "988ab2714549cb42e1367a641cc02eb7"
  },
  {
    "url": "lib/pep.js",
    "revision": "e5db6a6de593bc0f829e474bf6cdd7dc"
  },
  {
    "url": "src/$ColorBox.js",
    "revision": "90ce2527c4ad78bc0291e2fe30c349f3"
  },
  {
    "url": "src/$Component.js",
    "revision": "d370e2d60cf505bab25d9a52d8cd0029"
  },
  {
    "url": "src/$FontBox.js",
    "revision": "b56080e094773d1033a6bf18db76b81a"
  },
  {
    "url": "src/$Handles.js",
    "revision": "fca45ee2ee41410fbc693ce6b520980e"
  },
  {
    "url": "src/$MenuBar.js",
    "revision": "f072ae70a76f3652726c6179aaa6c971"
  },
  {
    "url": "src/$ToolBox.js",
    "revision": "6ab4fbf7522448042213f184eb1a5385"
  },
  {
    "url": "src/$Window.js",
    "revision": "7cfc2c53e4d6bf2659879f14c2725ed5"
  },
  {
    "url": "src/app.js",
    "revision": "db5e15b5d97ad1cc30d5c8e040b5f468"
  },
  {
    "url": "src/canvas-change.js",
    "revision": "7b4ddd26d91b374ef236e01b5a5bd2e2"
  },
  {
    "url": "src/electron-injected.js",
    "revision": "a9523aeccadda4d5cb442ec32af0b13c"
  },
  {
    "url": "src/electron-main.js",
    "revision": "e9438f8972d7753b4d21838419bc48cd"
  },
  {
    "url": "src/extra-tools.js",
    "revision": "c689519c895f173a8f00888a4b327475"
  },
  {
    "url": "src/functions.js",
    "revision": "7c4a4665b458d8f613077e679d791f22"
  },
  {
    "url": "src/help.js",
    "revision": "aaa6542e2532477c0f689d7c71854894"
  },
  {
    "url": "src/helpers.js",
    "revision": "12f6f698e511d275237ca5988bf6ebe9"
  },
  {
    "url": "src/image-manipulation.js",
    "revision": "7a372990f17251f13eb348ef20265cf7"
  },
  {
    "url": "src/imgur.js",
    "revision": "cc9f61eb50a7b3df0fe4db9b7ad4c04b"
  },
  {
    "url": "src/manage-storage.js",
    "revision": "e9e3c6fe0616bea1ee5a7ea124cf6899"
  },
  {
    "url": "src/menus.js",
    "revision": "a2397f292b9fce524f277f0b0f98c8ce"
  },
  {
    "url": "src/OnCanvasObject.js",
    "revision": "28ab355ca7ed8597eb3f1fc60203b558"
  },
  {
    "url": "src/OnCanvasSelection.js",
    "revision": "aac08c64cd574d056809f2085ef4def9"
  },
  {
    "url": "src/OnCanvasTextBox.js",
    "revision": "fab4fc10dc906a305892adebb357ae01"
  },
  {
    "url": "src/service-worker.js",
    "revision": "a0394817eb1249945eeb3ffcfcb6cb36"
  },
  {
    "url": "src/sessions.js",
    "revision": "efddf06b474bf565a554f8da2e993f96"
  },
  {
    "url": "src/storage.js",
    "revision": "e1a1f326c20fd5d4b22bb4449da66d95"
  },
  {
    "url": "src/theme.js",
    "revision": "b4279129cd4af835677b4d4e7c15d1fd"
  },
  {
    "url": "src/tool-options.js",
    "revision": "a3292e5765a4a4edebc9a31eeeb37830"
  },
  {
    "url": "src/tools.js",
    "revision": "a0256ad8cad9d7c06180fca9e05e2926"
  },
  {
    "url": "src/vaporwave-fun.js",
    "revision": "20542371d89ed46baab80a8eb15c558e"
  },
  {
    "url": "styles/layout.css",
    "revision": "6d6dbef7ae9d3f431dbcb69f7883678d"
  },
  {
    "url": "styles/normalize.css",
    "revision": "4a2ae678341616b73ff1c8d549d32465"
  },
  {
    "url": "styles/print.css",
    "revision": "1536af15b5451472d98e65dfcfa3d15e"
  },
  {
    "url": "styles/themes/classic.css",
    "revision": "fdd8d908bd2e84cd731b14c5e14db8f9"
  },
  {
    "url": "styles/themes/modern.css",
    "revision": "813a8d8970a2c7789cf3e7b420c92824"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
