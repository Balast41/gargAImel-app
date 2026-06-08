document.getElementById('recordButton').addEventListener('click', () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.id = 'audio';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0]

        const reader = new FileReader()

        reader.addEventListener("load", (event) => {
            const arrayBuffer = event.target.result

            const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)()

            audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
            visualize(audioBuffer, audioContext)
            })
        })

        reader.readAsArrayBuffer(file)
    });

    input.click();
});

function visualize(audioBuffer, audioContext) {
  const canvas = document.getElementById("canvas")
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 64

  const frequencyBufferLength = analyser.frequencyBinCount
  const frequencyData = new Uint8Array(frequencyBufferLength)

  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(analyser)
  analyser.connect(audioContext.destination)
  source.start()

  const canvasContext = canvas.getContext("2d")

  const barWidth = canvas.width / 64

  function draw() {
    requestAnimationFrame(draw)
    canvasContext.fillStyle = "rgb(49, 49, 49)"
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)

    analyser.getByteFrequencyData(frequencyData)

    for (let i = 0; i < frequencyBufferLength; i++) {
      // The frequency data is composed of integers on a scale from 0 to 255
      canvasContext.fillStyle = "rgb(255,255, 255)";
      canvasContext.fillRect(
        (frequencyBufferLength+i) * barWidth,
        canvas.height - frequencyData[i]/1.5,
        barWidth - 1,
        frequencyData[i]/1.5
      )
      canvasContext.fillRect(
        (frequencyBufferLength-i) * barWidth,
        canvas.height - frequencyData[i]/1.5,
        barWidth - 1,
        frequencyData[i]/1.5
      )
    }
  }

  draw()
}