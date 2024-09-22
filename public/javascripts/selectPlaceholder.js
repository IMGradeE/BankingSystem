function removePlaceHolder(event, element){
      var SelectPlaceHolder = document.getElementById(element);
      var select = SelectPlaceHolder.parentNode;
      select.removeAttribute("class");
      select.setAttribute("class", "form-select text-body");
      SelectPlaceHolder.removeAttribute("selected");
      SelectPlaceHolder.setAttribute("hidden", "hidden");
}