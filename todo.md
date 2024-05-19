* To Add:
- 


* To Change:
- make it so that replacing an element will make the new and old switch places
- have compare-method-selector only span 80% of width, and make compare-method-item
  wrap to a newline if overflowing

* To Fix:
- Make sure that after user submits ranking options and button turns green, that it stays green even
  if the options are moved around after the submission (as opposed to how it currently will turn
  gray if the new state wouldn't be valid)
- make sure 'compare' button always has space beaneath it since once the red message goes away, the button
  will go to the very bottom of the screen

- fix scaling on mask images. As an example, the category image silhouettes will take enture space, but object
  masks will not take entire space (compare bus object with states, and chamfer won't get tennessee since bus
  is too small comparitively)
- additionally, it is suspicious that hamming wouldn't return tennesse for bus comparison since bus is entirely 
  covered by a tennessee mask