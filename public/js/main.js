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
  $('.ui.fluid.card.dim')
  .visibility({
    once       : true,
    continuous : false,

    

    onPassed: {
      '20%': function(calculations) {
        // do something at 20%
        console.log(":::::Now passing:::::");
        //console.log(calculations);
        $(this).dimmer({
                 closable: false
                })
                .dimmer('show');
      }
    },
    onTopVisibleReverse:function(calculations) {
        // do something at 30%
        console.log(":::::Now passing bottom:::::");
        $(this).dimmer({
                 closable: false
                })
                .dimmer('show');
        }
      


  })
;



});