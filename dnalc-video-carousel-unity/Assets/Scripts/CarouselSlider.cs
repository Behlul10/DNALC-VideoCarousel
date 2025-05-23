using System.Collections.Generic;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class CarouselSlider : MonoBehaviour
{
    //referencing Connection Script from WebSocket
    //////////////////////////////////////////////////////////////////////
    public Connection connection;
    //////////////////////////////////////////////////////////////////////

    [Header("Content Vieport")]
    public RawImage contentDisplay;
    public List<GameObject> contentPanels;

    [Header("Navigation Dots")]
    public GameObject dotsContainer;
    public GameObject dotPrefab;

    [Header("Pagination Buttons")]
    public Button nextButton;
    public Button prevButton;

    [Header("Page Settings")]
    public bool useTimer = false;
    public bool isLimitedSwipe = false;
    public float autoMoveTime = 5f;
    private float timer;
    public int currentIndex = 0;
    public float swipeThreshold = 50f;
    private Vector2 touchStartPos;


    // Reference to the RectTransform of the content area
    public RectTransform contentArea;

    void Start()
    {

        // if you forgot to wire it in the Inspector, find it at runtime:
        if (connection == null)
            connection = FindObjectOfType<Connection>();
        //////////////////////////////////////////////////////////////////////

        nextButton.onClick.AddListener(NextContent);
        prevButton.onClick.AddListener(PreviousContent);

        // Initialize dots
        InitializeDots();

        // Display initial content
        ShowContent();

        // Start auto-move timer if enabled
        if (useTimer)
        {
            timer = autoMoveTime;
            InvokeRepeating("AutoMoveContent", 1f, 1f); // Invoke every second to update the timer
        }
    }

    void InitializeDots()
    {
        // Create dots based on the number of content panels
        for (int i = 0; i < contentPanels.Count; i++)
        {
            GameObject dot = Instantiate(dotPrefab, dotsContainer.transform);
            Image dotImage = dot.GetComponent<Image>();
            dotImage.color = (i == currentIndex) ? Color.white : Color.gray;
            dotImage.fillAmount = 0f; // Initial fill amount
            // You may want to customize the dot appearance and layout here
        }
    }

    void UpdateDots()
    {
        // Update the appearance of dots based on the current index
        for (int i = 0; i < dotsContainer.transform.childCount; i++)
        {
            RawImage dotImage = dotsContainer.transform.GetChild(i).GetComponent<RawImage>();
            dotImage.color = (i == currentIndex) ? Color.white : Color.gray;

            float targetFillAmount = timer / autoMoveTime;
            StartCoroutine(SmoothFill(dotImage, targetFillAmount, 0.5f));
        }
    }

    IEnumerator SmoothFill (RawImage image, float targetFillAmount, float duration)
    {
        float startFillAmount = image.uvRect.width;
        float elapsedTime = 0f;

        while (elapsedTime < duration)
        {
            float newFill = Mathf.Lerp(startFillAmount, targetFillAmount, elapsedTime / duration);
            image.uvRect = new Rect(0, 0, newFill, 1);
            elapsedTime += Time.deltaTime;
            yield return null;
        }

        image.uvRect = new Rect(0, 0, targetFillAmount, 1);
    }

    void Update()
    {
        // Detect swipe input only within the content area
        DetectSwipe();


        // 1) handle websocket‐driven commands:
        if (connection.currentMsg != null)
        {
            var state = connection.currentMsg.slideState;
            Debug.Log("message from Server" + state);
            if (state == "next")
                NextContent();
            else if (state == "previous")
                PreviousContent();

            // reset so we only fire once per message
            connection.currentMsg = null;
        }
    }

    void DetectSwipe()
    {

        if (Input.GetMouseButtonDown(0))
        {
            touchStartPos = Input.mousePosition;
        }

        if (Input.GetMouseButtonUp(0))
        {
            Vector2 touchEndPos = Input.mousePosition;
            float swipeDistance = touchEndPos.x - touchStartPos.x;

            // Check if the swipe is within the content area bounds
            if (Mathf.Abs(swipeDistance) > swipeThreshold && IsTouchInContentArea(touchStartPos))
            {
                if (isLimitedSwipe && ((currentIndex == 0 && swipeDistance > 0) || (currentIndex == contentPanels.Count - 1 && swipeDistance < 0)))
                {
                    // Limited swipe is enabled, and at the edge of content
                    return;
                }

                if (swipeDistance > 0)
                {
                    PreviousContent();
                }
                else
                {
                    NextContent();
                }
            }
        }


        /*
        if (msg.slideState == "next")
        {
            NextContent();
        }
        else if (msg.slideState == "previous")
        {
            PreviousContent();
        }
        */
        //if (slidestate == "next"){
        //     NextContent()
        //}
        //if (slidestate == "previous"){
        //     PreviousContent();
        //}
        // else if(slidestate == "null"){
        //     do nothin
        //}
    }

    // Check if the touch position is within the content area bounds
    bool IsTouchInContentArea(Vector2 touchPosition)
    {
        return RectTransformUtility.RectangleContainsScreenPoint(contentArea, touchPosition);
    }

    void AutoMoveContent()
    {
        timer -= 1f; // Decrease timer every second

        if (timer <= 0)
        {
            timer = autoMoveTime;
            NextContent();
        }

        UpdateDots(); // Update dots on every timer tick
    }

    void NextContent()
    {
        currentIndex = (currentIndex + 1) % contentPanels.Count;
        ShowContent();
        UpdateDots();
    }

    void PreviousContent()
    {
        currentIndex = (currentIndex - 1 + contentPanels.Count) % contentPanels.Count;
        ShowContent();
        UpdateDots();
    }

    void ShowContent()
    {
        // Activate the current panel and deactivate others
        for (int i = 0; i < contentPanels.Count; i++)
        {
            bool isActive = i == currentIndex;
            contentPanels[i].SetActive(isActive);

            // Update dot visibility and color based on the current active content
            Image dotImage = dotsContainer.transform.GetChild(i).GetComponent<Image>();
            dotImage.color = isActive ? Color.white : Color.gray;

            if (isActive)
            {
                // Reset timer and fill amount when the content is swiped
                timer = autoMoveTime;
                dotImage.fillAmount = 1f;
            }
            else
            {
                // Set the fill amount to 0 for non-active content
                dotImage.fillAmount = 0f;
            }
        }
    }

    public void SetCurrentIndex(int newIndex)
    {
        if (newIndex >= 0 && newIndex < contentPanels.Count)
        {
            currentIndex = newIndex;
            ShowContent();
            UpdateDots();
        }
    }
}