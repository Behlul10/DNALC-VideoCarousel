using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class MainMenu : MonoBehaviour
{
    [SerializeField] Button contentCarouselButton;
    [SerializeField] Button diggingGameButton;
    [SerializeField] Button idleStateButton;

    void Start()
    {
        if (contentCarouselButton == null) { return; }
        if (diggingGameButton == null) { return; }
        if (idleStateButton == null) { return; }
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void OnVideoCarousel()
    {
        SceneManager.LoadScene("VideoCarousel");
    }
 
    public void OnQuitButton()
    {
        Application.Quit();
    }
    
    public void OnIdleLogoButton()
    {
        SceneManager.LoadScene("IdleLogo");
    }
}
