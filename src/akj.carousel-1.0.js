/**
 * @title "AKJ Carousel"
 * @version "1.0 - 2011/8/16"
 * @version "0.1 - 2010/3/25"
 *
 * @author "Matthieu Guillemot"
 * @url "http://www.ankama.jp/"
 * @license "MIT License"
 *
 * Copyright (C) 2010-2011 by Ankama Japan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 */

(function($)
{
  $.fn.carousel = function(options)
  {
    var params = {
      initialAutoTime: 8000,
      autoTime: 4000,
      randomize: true,
      easing: null,
      pages: []
    };

    // If options exist, lets merge them with our default settings
    if (options)
    {
      $.extend(params, options);
    }

    if (params.easing === null && typeof jQuery.easing.easeInOutExpo === 'function')
    {
      params.easing = 'easeInOutExpo';
    }

    if (params.randomize)
    {
      for (var i = 0; i < params.pages.length; i++)
      {
        var j = Math.floor(Math.random() * params.pages.length);
        var temp = params.pages[i];
        params.pages[i] = params.pages[j];
        params.pages[j] = temp;
      }
    }
    else
    {
      params.pages.push(params.pages.shift());
    }

    var imageCache = [];

    function preloadImages()
    {
      for (var i = 0; i < arguments.length; i++)
      {
        var imgNode = document.createElement('img');
        imgNode.src = arguments[i];
        imageCache.push(imgNode);
      }
    }

    return this.each(function()
    {
      var pages = params.pages;
      var i, page;

      // Check minimum page count
      // TODO: implement graceful degradation for 1-page & 2-pages carousels
      if (pages.length < 3)
      {
        return;
      }

      // Create DOM structure
      var lastPage = pages[pages.length - 1];
      var carousel = $('<div/>')
              .addClass('carousel')
              .append('<div class="content"><div class="image-container"/><div class="opaque-layer">&nbsp;</div></div>')
              .append('<div class="frame">&nbsp;</div>')
              .append('<div class="content"><div class="text"><div class="container"><a><h2/><h3/></a></div></div><ul/></div>');
      $('a', carousel).attr('href', lastPage.url);
      $('h2', carousel).text(lastPage.bigText);
      $('h3', carousel).text(lastPage.smallText);
      $(this).append(carousel);

      // Add pages
      for (i = 0; i < pages.length; i++)
      {
        page = pages[i];
        $('ul', carousel).append('<li><a href="' + page.url + '"><img src="' + page.smallImg + '" alt="' + page.bigText + '" width="182" height="105"></a></li>');
      }

      // Load 2 first images into the carousel
      $('.image-container', carousel)
              .append('<img class="image-left" src="' + lastPage.bigImg + '" alt="' + lastPage.bigText + '" width="997" height="354">')
              .append('<img class="image-right" src="' + pages[0].bigImg + '" alt="' + pages[0].bigText + '" width="997" height="354">');

      // Preload other images (3rd++)
      for (i = 2; i < pages.length; i++)
      {
        preloadImages(pages[i].bigImg);
      }

      var animating = false;
      var nodes = $('ul li', carousel);
      for (i = 0; i < nodes.length; i++)
      {
        var node = nodes[i];
        page = pages[i];
        page.li = node;
        page.img = $('img', node)[0];
        page.url = $('a', node).attr('href');
      }

      function scroll(found)
      {
        if (animating)
        {
          return;
        }

        animating = true;
        var clickedPage = pages[found];
        var followers = [];
        for (var i = found + 1; i < pages.length; i++)
        {
          var page = pages[i];
          followers.push(page.img);
        }

        $('.image-right', carousel).attr('src', clickedPage.bigImg);

        $(clickedPage.img).animate({
          left: '-=182px',
          opacity: '0'
        }, 750, params.easing);

        $(followers).animate({
          top: '-=115px'
        }, 750, params.easing);

        $('.text', carousel).fadeOut(375, function()
        {
          $('a', this).attr('href', clickedPage.url);
          $('h2', this).text(clickedPage.bigText);
          $('h3', this).text(clickedPage.smallText);
        }).fadeIn(375);

        $('.image-container', carousel).animate({
          left: '-=997px'
        }, 750, params.easing, function()
        {
          for (var i = 0; i < pages.length; i++)
          {
            var page = pages[i];
            $(page.img).css('top', '0px')
                    .css('left', '0px')
                    .css('opacity', '1');
          }

          var ol = clickedPage.li.parentNode;
          ol.removeChild(clickedPage.li);
          ol.appendChild(clickedPage.li);
          pages.splice(found, 1);
          pages.push(clickedPage);

          var currentImage = $('.image-right', carousel).attr('src');
          $('.image-left', carousel).attr('src', currentImage);
          setTimeout(function()
          {
            $('.image-container', carousel).css('left', '0px');
          }, 0); // to prevent jitter on Firefox when images are swapped

          animating = false;
        });
      }

      $('ul a', carousel).each(function(i, node)
      {
        var parent = this.parentNode;
        var img = $('img', node)[0];
        parent.removeChild(this);
        parent.appendChild(img);
      });

      $('ul img', carousel).click(function(e)
      {
        for (var i = 0; i < pages.length; i++)
        {
          var page = pages[i];
          if (page.img === this)
          {
            reinitAutoScroll();
            scroll(i);
            return;
          }
        }
      });

      function reinitAutoScroll()
      {
        carousel.stopTime('firstAuto').stopTime('auto').oneTime(params.initialAutoTime, 'firstAuto', function()
        {
          carousel.everyTime(params.autoTime, 'auto', function()
          {
            scroll(0);
          });
        });
      }

      reinitAutoScroll();
    });
  };
})(jQuery);