# Use an official Python runtime as a parent image
FROM public.ecr.aws/lambda/python:3.12

# Install git using dnf (Amazon Linux 2023 uses dnf instead of yum)
RUN dnf install -y git && dnf clean all

# ARG GITHUB_TOKEN

# Set the working directory
WORKDIR /app
RUN git clone https://github.com/sanchitvj/data_engineer_portfolio.git
WORKDIR /app/data_engineer_portfolio
RUN git checkout content
RUN pip install .

COPY src/penguindb/lambda_function/status_checker.py ${LAMBDA_TASK_ROOT}/

WORKDIR ${LAMBDA_TASK_ROOT}
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD ["status_checker.lambda_handler"]