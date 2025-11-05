output "application_url" {
  description = "The secure, public URL for the deployed application."
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}
