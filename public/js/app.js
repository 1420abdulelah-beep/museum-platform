/* ==========================================
   SERAJ AL-AHSA - MVC ENTRY POINT BOOTSTRAPPER
   ========================================== */

window.App = window.App || {};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Instantiate Models
  const model = App.Model ? new App.Model() : null;
  const detailedPlanModel = App.DetailedPlanModel ? new App.DetailedPlanModel() : null;

  // 2. Instantiate Views
  const domView = App.DomView ? new App.DomView() : null;
  const audioView = App.AudioView ? new App.AudioView() : null;
  const canvasView = (App.CanvasView && model) ? new App.CanvasView(model) : null;
  const detailedPlanView = App.DetailedPlanView ? new App.DetailedPlanView() : null;

  // 3. Instantiate the Controller and bind MVC events
  if (App.Controller && model && domView) {
    const controller = new App.Controller(model, domView, audioView, canvasView, detailedPlanModel, detailedPlanView);
    controller.init();
    window.App.controllerInstance = controller;
  }

  // Keep instances globally inspectable for debugging if needed
  window.App.modelInstance = model;
  window.App.detailedPlanModelInstance = detailedPlanModel;
  window.App.domViewInstance = domView;
  window.App.audioViewInstance = audioView;
  window.App.canvasViewInstance = canvasView;
  window.App.detailedPlanViewInstance = detailedPlanView;
});
