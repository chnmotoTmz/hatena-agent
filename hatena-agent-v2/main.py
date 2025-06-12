#!/usr/bin/env python3
import os
import argparse
from dotenv import load_dotenv
from src.agents.article_extractor import HatenaArticleExtractor
from src.agents.retrieval_agent import RetrievalAgent
from src.agents.image_generator import ImageGenerator
from src.agents.affiliate_manager import AffiliateManager
from src.agents.repost_manager import RepostManager


def main():
    load_dotenv()
    
    parser = argparse.ArgumentParser(description='HATENA Agent - Blog Content Management System')
    parser.add_argument('--hatena-id', help='Your Hatena Blog ID (or set HATENA_BLOG_ID env var)')
    parser.add_argument('--mode', choices=['extract', 'enhance', 'repost', 'full'], 
                       default='full', help='Operation mode')
    parser.add_argument('--output-dir', default='./output', help='Output directory')
    
    args = parser.parse_args()
    
    # はてなブログIDを環境変数または引数から取得
    hatena_id = args.hatena_id or os.getenv('HATENA_BLOG_ID')
    if not hatena_id:
        print("Error: Hatena Blog ID is required. Set HATENA_BLOG_ID environment variable or use --hatena-id option.")
        return
    
    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)
    
    if args.mode in ['extract', 'full']:
        print("Step 1: Extracting articles from Hatena Blog...")
        blog_domain = os.getenv('BLOG_DOMAIN')
        extractor = HatenaArticleExtractor(hatena_id, blog_domain)
        articles = extractor.extract_all_articles(max_pages=5)
        
        print(f"Found {len(articles)} articles")
        
        for i, article in enumerate(articles[:10]):
            print(f"Extracting full content for article {i+1}/{min(10, len(articles))}")
            full_content = extractor.extract_article_content(article['url'])
            article.update(full_content)
        
        extractor.save_articles_to_json(
            articles, 
            os.path.join(args.output_dir, 'extracted_articles.json')
        )
        print("Articles saved to extracted_articles.json")
    
    if args.mode in ['enhance', 'full']:
        print("\nStep 2: Setting up enhancement features...")
        
        if args.mode == 'enhance':
            blog_domain = os.getenv('BLOG_DOMAIN')
            extractor = HatenaArticleExtractor(hatena_id, blog_domain)
            articles = extractor.load_articles_from_json(
                os.path.join(args.output_dir, 'extracted_articles.json')
            )
        
        print("\nStep 3: Setting up affiliate manager...")
        affiliate_manager = AffiliateManager()
        rakuten_tag = os.getenv('RAKUTEN_AFFILIATE_TAG')
        if rakuten_tag:
            affiliate_manager.set_affiliate_tag('rakuten', rakuten_tag)
        
        print("\nStep 4: Processing sample article with enhancements...")
        if articles and articles[0].get('full_content'):
            sample_article = articles[0]
            
            # アフィリエイトリンクの処理
            enhanced_content = sample_article['full_content']
            enhanced_content, processed_urls = affiliate_manager.process_article_content(
                enhanced_content,
                auto_detect=True
            )
            
            print("\nStep 5: Generating images for article...")
            bing_cookie = os.getenv('BING_AUTH_COOKIE')
            if bing_cookie:
                image_generator = ImageGenerator(
                    bing_auth_cookie=bing_cookie,
                    output_dir=os.path.join(args.output_dir, 'images')
                )
                
                featured_image = image_generator.create_featured_image(
                    sample_article['title'],
                    sample_article.get('summary', sample_article['title']),
                    style_preference="modern minimalist blog header"
                )
                if featured_image:
                    print(f"Featured image created: {featured_image}")
                
                # セッション終了
                image_generator.close_session()
            else:
                print("Bing cookie not found, skipping image generation")
                featured_image = None
            
            # 結果をHTMLファイルに保存
            with open(os.path.join(args.output_dir, 'enhanced_sample.html'), 'w', encoding='utf-8') as f:
                f.write(f"<h1>{sample_article['title']}</h1>\n")
                if featured_image:
                    f.write(f"<img src='{featured_image}' alt='Featured Image'>\n")
                f.write(enhanced_content)
            
            print("Enhanced sample saved to enhanced_sample.html")
            
            # アフィリエイトレポートを生成
            if processed_urls:
                affiliate_report = affiliate_manager.generate_affiliate_report(processed_urls)
                with open(os.path.join(args.output_dir, 'affiliate_report.md'), 'w', encoding='utf-8') as f:
                    f.write(affiliate_report)
                print("Affiliate report saved to affiliate_report.md")
    
    if args.mode in ['repost', 'full']:
        print("\nStep 6: Setting up repost manager...")
        
        if args.mode == 'repost':
            extractor = HatenaArticleExtractor(hatena_id)
            articles = extractor.load_articles_from_json(
                os.path.join(args.output_dir, 'extracted_articles.json')
            )
        
        repost_manager = RepostManager(hatena_id)
        
        print("Analyzing article performance...")
        performance_data = repost_manager.analyze_article_performance(articles)
        
        print("\nTop 5 articles by performance score:")
        for i, article in enumerate(performance_data[:5]):
            print(f"{i+1}. {article['title']} (Score: {article['performance_score']})")
        
        print("\nGenerating repost calendar...")
        calendar = repost_manager.generate_repost_calendar(articles, weeks_ahead=4)
        repost_manager.export_repost_plan(
            calendar, 
            os.path.join(args.output_dir, 'repost_calendar.json')
        )
        
        print(f"Repost calendar created with {len(calendar)} articles")
        
        if calendar:
            first_repost = calendar[0]
            repost_content = repost_manager.create_repost_content(
                first_repost['article'],
                update_type=first_repost['update_type']
            )
            
            repost_content = repost_manager.update_repost_with_new_info(
                repost_content,
                ["最新の情報を追加しました", "関連リンクを更新しました"]
            )
            
            with open(os.path.join(args.output_dir, 'sample_repost.html'), 'w', encoding='utf-8') as f:
                f.write(f"<h1>{repost_content['title']}</h1>\n")
                f.write(repost_content['content'])
            
            print("Sample repost saved to sample_repost.html")
    
    print("\nAll operations completed successfully!")
    print(f"Output files are in: {args.output_dir}")


if __name__ == "__main__":
    main()