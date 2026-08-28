function Image(el)
  el.attributes["loading"] = "lazy"
  el.attributes["decoding"] = "async"
  return el
end