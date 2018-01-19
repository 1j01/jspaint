var $imgur_window;

function upload_to_imgur(){
  if($imgur_window){
    $imgur_window.close();
  }
  $imgur_window = $FormWindow().title("Upload to Imgur").addClass("dialogue-window");
  $imgur_window.$main.html("<label>URL: </label><a id='imgur-url' href='' target='_blank'></a>");
  var $imgur_url = $imgur_window.$main.find("#imgur-url");

  $imgur_window.$Button("Upload", function(){
    // base64 encoding to send to imgur api
    var base64 = canvas.toDataURL().split(",")[1];
    
  });
  $imgur_window.$Button("Cancel", function(){
    $imgur_window.close();
  });
  $imgur_window.width(300);
  $imgur_window.center();
  // $input.focus();
}
