function expand(i) {
    if($('#piece'+i).is(":hidden")){
        $('#piece'+i).show();
    }
    else{
        $('#piece'+i).hide();
    }
}