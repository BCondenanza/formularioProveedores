sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("finning.formularioproveedores.controller.Main", {
        onInit() {
            var oModel = new sap.ui.model.json.JSONModel({
                formValid: false
            });
            this.getView().setModel(oModel);
            this.urlIDS = "/ias/";

            this._attachedFilesContent = {};
           
            //Por defecto se muestra Chile
            this._setFieldsVisibleForCountry("CHFields");
        },

        onCountryChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            
            // Ocultar todos los campos de todos los países primero
            this._setAllCountryFieldsVisible(false);

            // Mostrar solo los campos del país seleccionado
            if (sSelectedKey) {
                this._setFieldsVisibleForCountry(sSelectedKey, true);
            }
            this.onFormChange();
            this.clearAttachments();
        },
        
        isValidEmail: function(email) {
            // Regex básico para validar formato email
            var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        onFormChange: function () {
            var oView = this.getView();
            var bValid = true;
        
            // Validar campos de texto
            [
                "Nombre", "Apellido", "Email", "RepEmail", "IdentificadorFiscal", "FacturaOrden"
            ].forEach(function (sName) {
                var oInput = oView.byId("CommonFields").findElements(true).find(el => el.getName?.() === sName);
                if (!oInput || !oInput.getValue().trim()) {
                    bValid = false;
                }
            });
                
            // Validar checkbox
            var bTermsAccepted = oView.byId("acceptTerms").getSelected();
            if (!bTermsAccepted) {
                bValid = false;
            }
        
            // Validar FileUploader visibles
            var sSelectedCountry = oView.byId("countrySelect").getSelectedKey();
            var oCountryVBox = oView.byId(sSelectedCountry);
            if (oCountryVBox && oCountryVBox.getVisible()) {
                oCountryVBox.getItems().forEach(function (oVBox) {
                    var oUploader = oVBox.getItems().find(item => item.isA?.("sap.ui.unified.FileUploader"));
                    if (oUploader && !oUploader.getValue()) {
                        bValid = false;
                    }
                });
            }
            
            var submitButton=oView.byId("subBtn");
            if(bValid){
                submitButton.removeStyleClass("submitBtnUnabled");
                submitButton.addStyleClass("submitBtnEnabled");
            }
            else{
                submitButton.removeStyleClass("submitBtnEnabled");
                submitButton.addStyleClass("submitBtnUnabled");
            }

        },

        onFileChange: function(oEvent) {
            const oFileUploader = oEvent.getSource();
            const sFileUploaderName = oFileUploader.getName();
            const aFiles = oEvent.getParameter("files");
            
            
            if (aFiles && aFiles.length > 0) {
                const oFile = aFiles[0]; 
                const reader = new FileReader();
        
                reader.onload = (e) => {
                    this._attachedFilesContent[sFileUploaderName] = oFile;
                };
        
                reader.onerror = (e) => {
                    delete this._attachedFilesContent[sFileUploaderName];
                    sap.m.MessageToast.show("Error al leer el archivo. Por favor, inténtalo de nuevo.");
                };
        
                reader.readAsDataURL(oFile); 

                
            } else {
                // Si el archivo fue deseleccionado o el input se limpió
                delete this._attachedFilesContent[sFileUploaderName];
            }
            this.onFormChange();
        },

        onSubmit: function () {
            var oView = this.getView();
        
            var bValid = true;
        
            // Validar CommonFields
            var oCommonFieldsVBox = oView.byId("CommonFields");
            var aCommonVBoxChildren = oCommonFieldsVBox.getItems();
        
            var sEmail = "";
            var sRepEmail = "";
            var that=this;
            aCommonVBoxChildren.forEach(function(oVBox) {
                var oInput = oVBox.getItems().find(item => item.isA && item.isA("sap.m.Input"));
                if (oInput) {
                    var sValue = oInput.getValue();
                    var sName = oInput.getName();
        
                    if (!sValue || sValue.trim() === "") {
                        oInput.setValueState("Error");
                        bValid = false;
                    } else {
                        // Validar formato email para Email y RepEmail
                        if (sName === "Email") {
                            if (!that.isValidEmail(sValue)) {
                                oInput.setValueState("Error");
                                bValid = false;
                            } else {
                                oInput.setValueState("None");
                                sEmail = sValue;
                            }
                        } else if (sName === "RepEmail") {
                            if (!that.isValidEmail(sValue)) {
                                oInput.setValueState("Error");
                                bValid = false;
                            } else {
                                oInput.setValueState("None");
                                sRepEmail = sValue;
                            }
                        } else {
                            oInput.setValueState("None");
                        }
                    }
                }
            });
        
            // Validar que Email y RepEmail coincidan
            if (sEmail && sRepEmail && sEmail !== sRepEmail) {
                // Buscar inputs Email y RepEmail para marcar error
                var oEmailInput = aCommonVBoxChildren
                    .map(v => v.getItems().find(i => i.isA && i.isA("sap.m.Input") && i.getName() === "Email"))
                    .find(Boolean);
                var oRepEmailInput = aCommonVBoxChildren
                    .map(v => v.getItems().find(i => i.isA && i.isA("sap.m.Input") && i.getName() === "RepEmail"))
                    .find(Boolean);
        
                if (oEmailInput) oEmailInput.setValueState("Error");
                if (oRepEmailInput) oRepEmailInput.setValueState("Error");
                bValid = false;
                sap.m.MessageToast.show("Los correos electrónicos no coinciden.");
            }
        
            var sSelectedCountry = oView.byId("countrySelect").getSelectedKey();
            var oCountryVBox = oView.byId(sSelectedCountry);

            if (oCountryVBox && oCountryVBox.getVisible()) {
                var aCountryVBoxes = oCountryVBox.getItems();
                aCountryVBoxes.forEach(function(oVBox) {
                    var oFileUploader = oVBox.getItems().find(item => item.isA && item.isA("sap.ui.unified.FileUploader"));
                    if (oFileUploader) {
                        var sValue = oFileUploader.getValue();
                        if (!sValue) {
                            oFileUploader.setValueState("Error");
                            bValid = false;
                        } else {
                            oFileUploader.setValueState("None");
                        }
                    }
                });
            }
        
            // Validar checkbox
            var oCheckBox = oView.byId("acceptTerms");
            if (!oCheckBox.getSelected()) {
                oCheckBox.setValueState("Error");
                bValid = false;
            } else {
                oCheckBox.setValueState("None");
            }
        
            if (bValid) {
                MessageToast.show("Formulario válido. Enviando datos...");
                // lógica submit
                
                try{
                    this.sendEmail();
                }
                catch(e){
                    console.log(e);
                }

            } else if (!(sEmail && sRepEmail && sEmail !== sRepEmail)) {
                // Solo muestra mensaje genérico si no es error de mails que ya se mostró arriba
                MessageToast.show("Por favor, complete todos los campos requeridos correctamente.");
            }

        },

        _setFieldsVisibleForCountry: function(sCountryKey, bVisible) {
            this.byId(sCountryKey).setVisible(bVisible);
         
         
        },
        

        _setAllCountryFieldsVisible: function(bVisible) {
            this.byId("CHFields").setVisible(bVisible);
            this.byId("ARFields").setVisible(bVisible);
            this.byId("BOLFields").setVisible(bVisible);
        },

        _getControlIdsForCountry: function(sCountryKey) {
            let aVBoxIds = [];
        
            switch (sCountryKey) {
                case "CL": // Chile
                    aVBoxIds = ["CHFields"];
                    break;
                case "AR": // Argentina
                    aVBoxIds = ["ARFields"];
                    break;
                case "BO": // Bolivia
                    aVBoxIds = ["BOLFields"];
                    break;
                default:
                    aVBoxIds = [];
            }
        
            return aVBoxIds;
        },

        clearAttachments: function(){

            // Limpiar adjuntos
            var aCountryVBoxIds = [].concat(
                this._getControlIdsForCountry("CL"),
                this._getControlIdsForCountry("AR"),
                this._getControlIdsForCountry("BO")
            );       

            aCountryVBoxIds.forEach(function(sVBoxId) {
                var oVBox = this.getView().byId(sVBoxId); 
                if (oVBox) {
                
                    oVBox.getAggregation("items").forEach(function(oInnerVBox) {
                        if (oInnerVBox && oInnerVBox.isA("sap.m.VBox")) {
                            oInnerVBox.getAggregation("items").forEach(function(oControl) {
                                
                                if (oControl && oControl.isA("sap.ui.unified.FileUploader")) {
                                    oControl.clear();
                                }
                            });
                        }
                    });
                }
            }.bind(this)); 
            this._attachedFilesContent={};
            this.onFormChange();
        },


        _clearForm: function() {          

            // Limpiar campos en común
            var oCommonFieldsVBox = this.getView().byId("CommonFields");
            if (oCommonFieldsVBox) {
                oCommonFieldsVBox.getAggregation("items").forEach(function(oInnerVBox) {
                    if (oInnerVBox && oInnerVBox.isA("sap.m.VBox")) {
                        oInnerVBox.getAggregation("items").forEach(function(oControl) {
                            if (oControl && oControl.isA("sap.m.Input")) {
                                oControl.setValue("");
                            }
                        });
                    }
                });
            }
            this.clearAttachments();
           
        },
        
        onClearForm: function(){
            this._clearForm();
        },

        _prepareEmailData: function () {
            const oView = this.getView();
            const oCountrySelect = oView.byId("countrySelect");
            const sSelectedCountryKey = oCountrySelect.getSelectedKey();
        
            // Obtener los valores de los campos comunes (Inputs)
            const oCommonFieldsVBox = oView.byId("CommonFields");
            let oCommonData = {};
            if (oCommonFieldsVBox) {
                oCommonFieldsVBox.getAggregation("items").forEach(function (oInnerVBox) {
                    if (oInnerVBox && oInnerVBox.isA("sap.m.VBox")) {
                        oInnerVBox.getAggregation("items").forEach(function (oControl) {
                            if (oControl && oControl.isA("sap.m.Input")) {
                                const sControlName = oControl.getName();
                                if (sControlName) {
                                    oCommonData[sControlName] = oControl.getValue();
                                }
                            }
                        });
                    }
                });
            }
        
            // Obtener los nombres de archivo de los FileUploaders específicos del país
            let aAttachments = [];
            const oCountryVBox = this.getView().byId(sSelectedCountryKey);
        
            if (oCountryVBox && this._attachedFilesContent) {
                oCountryVBox.getItems().forEach(oInnerVBox => {
                    const aInnerItems = oInnerVBox.getItems();
                    const oLabel = aInnerItems.find(c => c.isA("sap.m.Label"));
                    const oUploader = aInnerItems.find(c => c.isA("sap.ui.unified.FileUploader"));
        
                    if (oLabel && oUploader) {
                        const sName = oUploader.getName();
                        const oFileData = this._attachedFilesContent[sName];
                        if (oFileData) {
                            aAttachments.push({
                                name: sName,
                                label: oLabel.getText(),
                                fileData: oFileData
                            });
                        }
                    }
                });
            }
        
            const mCountryNames = {
                CHFields: "Chile",
                ARFields: "Argentina",
                BOLFields: "Bolivia"
            };
        
            const paisSolicitud = mCountryNames[sSelectedCountryKey];
        
            const commonData = {
                email: oCommonData.Email || '',
                name: oCommonData.Nombre || '',
                lastName: oCommonData.Apellido || '',
                idFiscal: oCommonData.IdentificadorFiscal || '',
                nFact: oCommonData.FacturaOrden || '',
                country: paisSolicitud
            };
        
            const emailData = new FormData();
        
            // IMPORTANTE: stringify del objeto para que el backend lo pueda parsear
            emailData.append("commonFields", JSON.stringify(commonData));
        
            aAttachments.forEach((attachment, index) => {
                emailData.append(`label_${index}`, attachment.label);
                emailData.append("attachments", attachment.fileData);
            });
        
            return emailData;
        },
        

   
        
        sendEmail: function () {        
          
            const oPayload = this._prepareEmailData();
            for (let pair of oPayload.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
            }

            $.ajax({
              url: "https://finning-chile-finning-dev-qas-cf-us-east-a3b5vigd-porta2779e2dc.cfapps.us10.hana.ondemand.com/send-email",
              method: "POST",
              data: oPayload,
              processData: false,  
              contentType: false,
              success: function (response) {
                alert("Correo enviado con éxito");
              },
              error: function (xhr, status, error) {
                console.error("Error al enviar el correo:", error);
                console.error("Respuesta del servidor:", xhr.responseText);
                alert("Error al enviar el correo: " + (xhr.responseJSON?.error || "Sin mensaje"));
              }
            });
          }

    });
});