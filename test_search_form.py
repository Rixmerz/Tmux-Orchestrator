def test_search_functionality(self):
    """Test the SearchForm component specifically"""
    # Navigate to admin products page
    self.driver.get("http://localhost:8000/admin/products")
    
    # Test brand filter
    brand_select = self.driver.find_element(By.NAME, "brand")
    brand_select.send_keys("Nike")
    
    # Test category filter  
    category_select = self.driver.find_element(By.NAME, "category")
    category_select.send_keys("Shoes")
    
    # Submit form
    submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    
    # Verify URL parameters
    current_url = self.driver.current_url
    assert "brand=Nike" in current_url
    assert "category=Shoes" in current_url