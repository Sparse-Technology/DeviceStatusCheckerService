{
  /* <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/9000.0.1/prism.min.js" integrity="sha512-UOoJElONeUNzQbbKQbjldDf9MwOHqxNz49NNJJ1d90yp+X9edsHyJoAs6O4K19CZGaIdjI5ohK+O2y5lBTW6uQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/9000.0.1/themes/prism-coy.min.css" integrity="sha512-XcB0I04SuOVkb6ewfVz0qMhU5QADIiFBFxPRRNWZUANF1W5onx8GlbHYYIivw3gXrTuZfu+1gAG8HvvKQG3oGA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<!--FontAwesome-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/js/all.min.js" integrity="sha512-xgIrH5DRuEOcZK5cPtVXx/WSp5DTir2JNcKE5ahV2u51NCTD9UDxbQgZHYHVBlPc4H8tug6BZTYIl2RdA/X0Vg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<!--Popper-->
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
<!--Tagify-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/tagify/4.17.9/tagify.min.js" integrity="sha512-E6nwMgRlXtH01Lbn4sgPAn+WoV2UoEBlpgg9Ghs/YYOmxNpnOAS49+14JMxIKxKSH3DqsAUi13vo/y1wo9S/1g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tagify/4.17.9/tagify.polyfills.min.js" integrity="sha512-OGxNMTtOXzAr3xHRspCBzVk9sPnbNOA0YONffApN1p8zyVSBSgPqMMpCwdadRkRVW9VFqrnQTdj3RgyKxoqM1A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tagify/4.17.9/tagify.min.css" integrity="sha512-yWu5jVw5P8+IsI7tK+Uuc7pFfQvWiBfFfVlT5r0KP6UogGtZEc4BxDIhNwUysMKbLjqCezf6D8l6lWNQI6MR7Q==" crossorigin="anonymous" referrerpolicy="no-referrer" /> */
}

// Import CSS
import '@yaireo/tagify/dist/tagify.css';

//Import JS
import jQuery from 'jquery';
import hljs from 'highlight.js';
import 'highlight.js/styles/intellij-light.css'

import Tagify from "@yaireo/tagify";
import TagifyPolyfills from '@yaireo/tagify/dist/tagify.polyfills.min';
import fontawesome from "@fortawesome/fontawesome-free/js/all.js";
import popper from "popper.js";
// import {jsonrepair} from "jsonrepair/lib/cjs/index";

// hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));

export default {
  jQuery,
  hljs,
  TagifyPolyfills,
  Tagify,
  fontawesome,
  popper,
  // jsonrepair
};
