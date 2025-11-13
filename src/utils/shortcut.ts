import * as practiceService from '../services/practiceService';

export function initShortcut() {
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === 'ArrowRight') {
      practiceService.setNextQuestion();
      return;
    }
    if (event.altKey && event.key === 'ArrowLeft') {
      practiceService.setPrevQuestion();
      return;
    }
  });
}
