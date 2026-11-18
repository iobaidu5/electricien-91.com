

jQuery(document).ready(function ($) {
  var successMessage = `<i class="fa fa-info-circle"></i><b class="success-message">Succès:</b> Votre demande est envoyée avec succès`;
  var ErrorMessage = `<i class="fa fa-info-circle"></i><b class="error-message">Erreur:</b> Veuillez vérifier vos données d'entrée`;
  // var checkbox = document.querySelector('input[name="condition"]');
  // var checkboxError = document.getElementById('checkboxError');

  // Every form posting to the BH notify API: contact, devis, the quote form
  // (home hero + city pages), the footer call-back and the header "Rappeler".
  $("#contactForm, #devisForm, form.js-notify-form").on("submit", function (e) {
    sendFormData(e, this);
  });

  function sendFormData(e, form) {
    e.preventDefault();
    var $form = $(form);
    // message slot: contact/devis keep their own ids, the others use .form-response
    var $response = $form.find("#contact-form-response, #devis-form-response, .form-response").first();
    var $captcha = $form.find(".g-recaptcha");

    // This site's key is a reCAPTCHA v2 (checkbox) key: the widget rendered in
    // the form's .g-recaptcha div writes its token to a
    // <textarea name="g-recaptcha-response">, which serialize() sends to the
    // notify API along with the `key` field so it can be checked server-side.
    // (Calling Google's siteverify from the browser is impossible: it sends no
    // CORS headers, so that fetch always failed.)
    // Forms without a widget (the one-line "Rappeler" bar) skip this check.
    if ($captcha.length) {
      var recaptchaInput = form.querySelector('[name="g-recaptcha-response"]');
      if (!recaptchaInput || !recaptchaInput.value) {
        alert("Veuillez vérifier le reCAPTCHA");
        return false;
      }
    }

    var $submit = $form.find('[type="submit"]').prop("disabled", true);
    $response.removeClass("error success").empty();

    $.ajax({
      url: form.action,
      type: "POST",
      data: $form.serialize(),
      datatype: "json",
      success: function () {
        window.location.href = $form.find('[name="redirectUrl"]').val() || "/message-envoye";
      },
      error: function (jqXHR, textStatus) {
        console.log(textStatus);
        $submit.prop("disabled", false);
        // a v2 token is single-use: give the visitor a fresh checkbox to retry.
        // Auto-rendered widgets are numbered in document order.
        if ($captcha.length && typeof grecaptcha !== "undefined") {
          grecaptcha.reset($(".g-recaptcha").index($captcha[0]));
        }
        $response.addClass("error").html(ErrorMessage);
      },
    });
  }
  // $("#clone_g_re_captcha").html($("#g_re_captcha").clone(true, true));
  $("#contact-form").prop("disabled", true);
});

var CaptchaCallback = function () {
  jQuery(".g-recaptcha").each(function () {
    grecaptcha.render(this, {
      sitekey: "{{ site.data.company.recaptcha.client }}",
      callback: correctCaptcha,
    });
  });
};

function correctCaptcha() {
  if (grecaptcha === undefined) {
    return;
  }
  console.log(grecaptcha.getResponse());
  document.querySelectorAll(".g-recaptcha").forEach((checkbox) => {
    checkbox.classList.add("hidden");
  });
  document.querySelectorAll(".form-submit").forEach((button) => {
    button.innerHTML = "Envoyer";
    button.disabled = false
  });
}
