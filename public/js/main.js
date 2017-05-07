$(document).ready(function() {

  //close messages from flash message
  $('.message .close')
  .on('click', function() {
    $(this)
      .closest('.message')
      .transition('fade')
    ;
  });

  //new junks
  $('.ui.fluid.card')
  .visibility({
    once       : true,
    continuous : false,

    

    onPassed: {
      '20%': function(calculations) {
        // do something at 30%
        console.log(":::::Now passing:::::");
        $(this).dimmer({
                 closable: false
                })
                .dimmer('show');
        /*$(this).dimmer({
            closable: 'false',
            'show'
          })
        ;*/
      //Do this to check for all classes where this is the case, or change PUG to do this for us
      // $(this).dimmer('set active');

      }
    }
  })
;



});