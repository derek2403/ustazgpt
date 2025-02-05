import { NextPage } from "next";
import { useState } from "react";
import Loading from "./loading";
import { API_CONFIG } from "../config/constants";

const Questions: NextPage = () => {
  const [questionsInput, setQuestionsInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: any) {
    event.preventDefault();
    if (questionsInput.trim().length === 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: questionsInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const playTextToSpeech = async (text: string) => {
    try {
      console.log('Sending TTS request...');
      const response = await fetch(`${API_CONFIG.NEXT_API_URL}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "audio/wav",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log('Received audio blob:', audioBlob.size, 'bytes');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Clean up URL after playing
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Failed to generate speech");
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="mb-6">
          <label
            htmlFor="questions"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Ask your question
          </label>
          <textarea
            id="questions"
            rows={4}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Type your question here..."
            value={questionsInput}
            onChange={(e) => setQuestionsInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || questionsInput.length === 0}
          className={`text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${
            (loading || questionsInput.length === 0) && "cursor-not-allowed opacity-50"
          }`}
        >
          Submit
        </button>
      </form>

      {loading && <Loading />}
      
      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Answer:</h3>
            <button
              onClick={() => playTextToSpeech(result)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              Play Response
            </button>
          </div>
          <div className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
