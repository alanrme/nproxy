// LOADER HIDE
$(window).on("load", function() {
    $('#loader-bg').animate({opacity: 0}, 300, function () { $('#loader-bg').hide();} );
    // fade out loader, then hide
})

$(function(){
    window.scrollTo(0, 0); // scroll to top on page load

    
    // DISABLE RIGHT CLICK
    $(".norightclick").on("contextmenu",function(e){
        return false;
    });
    

    //MOBILE MENU
    $('.menu').on("click", function(e){
        $('nav a').each(function () { // for each nav item on desktop, clone that to mobile menu
            if(!$(this).is('menu')) $(this).clone().appendTo($('#menu')); // don't clone the menu button though!
        })

        $('#menu-bg').css({'display': 'flex', opacity: 0}).animate({opacity: 1}, 300);
        // fade in menu
    });
    $('.m-close, #menu-bg').on("click", function(e){ // when close button clicked
        // and fade out menu
        $('#menu-bg').animate({opacity: 0}, 300, function () {
            $('#menu-bg').css('display', 'none')
            $("#menu > *:not('.m-close')").remove(); // lastly empty the menu except for close button
        });
    });

    
    // SCROLL UP BUTTON
    let scrollup = $('.scrollup')
    scrollup.on('click', function () { // if scroll up clicked
        $('html, body').animate({ // animated scroll to top in 800ms
            scrollTop: 0
        }, 800);
    })

    
    // Checking if element is in viewport (used for parallax scroll)
    function isInViewport(node) {
        var rect = node.getBoundingClientRect()
        return (
          (rect.height > 0 || rect.width > 0) &&
          rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.left <= (window.innerWidth || document.documentElement.clientWidth)
        )
    }


    // SCROLL POSITION
    let scrollpos = 0;
    $(window).scroll(function () { // when scrolling
        scrollpos = $(window).scrollTop();
    });


    let intro; // top of content
    let nav = $('nav')

    // run every 250ms, put most scroll events here
    // more efficient than the scroll event
    window.setInterval(function(){
        intro = $('.content').offset().top; // set top of content
        // this is in a loop so that when the screen is turned it will update with the new position

        // SHOW/HIDE SCROLL UP BUTTON
        if (scrollpos > intro) { // if user scrolls below intro, show button
            scrollup.fadeIn(300)
        } else { // scroll above, hide button
            scrollup.fadeOut(300)
        }


        // FIXED NAV
        // handles attaching nav to screen when scrolled far enough
        if (scrollpos > 200) { // after the nav is no longer visible
            if (!nav.hasClass('scrolled')) nav.addClass('scrolled');

            // nest these since realistically they only run if the
            // scroll is above 100, more efficient code
            if (scrollpos > intro) {
                if (!nav.hasClass('awake')) nav.addClass('awake');
            }
            if (scrollpos < intro) {
                if (nav.hasClass('awake')) {
                    nav.removeClass('awake');
                    nav.addClass('sleep');
                }
            }
        } 
        if (scrollpos < 200) {
            if (nav.hasClass('scrolled')) nav.removeClass('scrolled sleep');
        }
    }, 150);
});